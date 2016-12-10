'use strict';

const babylon = Npm.require('babylon');
const fsPath = Npm.require('path');
const recast = Npm.require('recast');

const babylonParser = {
  parse: function (code) {
    return babylon.parse(code, {
      allowImportExportEverywhere: true,
      plugins: ['jsx', 'flow', 'objectRestSpread']
    });
  }
};

// Transpiles ES2015+ code using Babel from the babel-compiler package
function processOneFileForTarget(inputFile, code) {
  const options = Babel.getDefaultOptions({
    react: true
  });

  const transpiled = Babel.compile(code, options);
  const path = inputFile.getPathInPackage();

  return {
    sourcePath: path,
    path,
    data: transpiled.code,
    hash: transpiled.hash
  };
}

class SplittingCompiler {
  processFilesForTarget(inputFiles) {
    this.files = {};
    this.bundleCounter = 0;

    const rootBundle = new Bundle(0);

    inputFiles.forEach(inputFile => {
      if (inputFile.getArch() === 'web.browser') {
        const file = {
          path: '/' + inputFile.getPathInPackage(),
          code: inputFile.getContentsAsString(),
          inputFile
        };

        this.collectImports(file);
        this.files[file.path] = file;

        // Eagerly loaded bundle
        if (file.path.startsWith('/client/')) {
          rootBundle.add(file);
        }
      } else {
        inputFile.addJavaScript(processOneFileForTarget(
          inputFile, inputFile.getContentsAsString()
        ));
      }
    });

    this.createBundles(rootBundle);
    rootBundle.optimize();

    this.emitBundles(rootBundle, inputFiles);

    // Emit eagerly loaded modules and stubs for asynchronously loaded modules
    for (let path in this.files) {
      const file = this.files[path];
      const inputFile = file.inputFile;

      if (rootBundle.includes(path)) {
        inputFile.addJavaScript(processOneFileForTarget(
          inputFile, file.code
        ));
      } else {
        let code = `meteorModuleStubs["${path}"](require, exports, module);`;
        code += this.fakeImports(file);

        inputFile.addJavaScript({ data: code });
      }
    }
  }

  // Converts a path relative to the given file to an absolute path.
  absoluteModulePath(path, file) {
    if (!path.startsWith('.')) {
      return path;
    }

    return fsPath.join(fsPath.dirname(file.path), path);
  }

  // Returns the file for the given path.
  resolvePath(path) {
    let file = this.files[path]
      || this.files[`${path}.js`]
      || this.files[`${path}/index.js`];

    return file;
  }

  // Searches for imports in the given file and stores them in its `imports`
  // property. Functions that import files asynchronously are transformed in
  // order to make them wait until imported modules are loaded.
  collectImports(file) {
    const self = this, asyncCandidates = [];

    const ast = recast.parse(file.code, {
      parser: babylonParser
    });

    const imports = {
      static: new Set,
      async: {},
      all: new Set // All imports for convenient access
    };

    recast.types.visit(ast, {
      visitFunction: function (astPath) {
        if (astPath.node.async) {
          asyncCandidates.unshift(new Set);
        }

        this.traverse(astPath);

        // If this function is asynchronous and imports modules, insert an
        // await expression which ensures that modules from the bundle are
        // loaded before continuing execution.
        let candidates;

        if (astPath.node.async) {
          candidates = asyncCandidates.shift();
        }

        if (candidates && candidates.size > 0) {
          const b = recast.types.builders;
          const bundleId = ++self.bundleCounter;

          imports.async[bundleId] = candidates;

          const ensureCall = b.expressionStatement(
            b.awaitExpression(b.callExpression(
              b.identifier('meteorEnsureBundle'),
              [b.literal(bundleId)]
            ))
          );

          astPath.node.body.body.unshift(ensureCall);
        }
      },

      visitImportDeclaration: function (astPath) {
        const path = self.absoluteModulePath(astPath.node.source.value, file);

        if (!path.startsWith('/')) return false;

        if (asyncCandidates[0]) {
          asyncCandidates[0].add(path);
        } else {
          imports.static.add(path);
        }

        imports.all.add(path);

        return false;
      }
    });

    file.imports = imports;
    file.code = recast.print(ast).code;
  }

  // Recursively finds all static imports for the given file.
  findStaticImports(file, set) {
    let imports = file.imports.static;

    if (!set) {
      set = new Set;
    }

    imports.forEach(path => {
      const childFile = this.resolvePath(path);

      // Don't attempt to find imports for files that are unknown to this build
      // plugin, e.g., HTML and CSS
      if (!childFile) {
        return;
      }

      if (!set.has(childFile.path)) {
        set.add(childFile.path);
        this.findStaticImports(childFile, set);
      }
    });

    return set;
  }

  // Recursively creates child bundles for the given bundle and includes all
  // required imports.
  createBundles(bundle) {
    bundle.forEach(file => {
      this.findStaticImports(file).forEach(path => {
        bundle.add(this.files[path]);
      });
    });

    bundle.forEach(file => {
      for (let bundleId in file.imports.async) {
        const childBundle = new Bundle(bundleId, bundle);

        file.imports.async[bundleId].forEach(path => {
          childBundle.add(this.resolvePath(path));
        });

        this.createBundles(childBundle);
        bundle.children.push(childBundle);
      }
    });
  }

  // Generates an if statement whose body will never be executed and contains
  // imports for all direct dependencies of the given file. Adding these fake
  // imports to module stubs is necessary because otherwise, Meteor would
  // consider their imports as unused and won't include them in the bundle.
  fakeImports(file) {
    let code = '';

    if (file.imports.all.size > 0) {
      let body = '';
      file.imports.all.forEach(path => body += `module.import("${path}");`);

      return `if (false) {${body}}`;
    } else {
      return '';
    }
  }

  emitBundles(bundle, inputFiles) {
    // The first bundle consisting of eagerly loaded files and their
    // dependencies is already written by Meteor, so we can skip it here.
    if (bundle.parent) {
      let code = '';

      bundle.forEach(file => {
        const stub = `meteorModuleStubs["${file.path}"]`;

        const transpiled = processOneFileForTarget(
          file.inputFile, file.code
        );

        code +=
`${stub} = ${stub} || function (require, exports, module) {
${transpiled.data}
};\n`;
      });

      // Bundles have to be minified here because they are not passed to the
      // minifier plugin. Meteor doesn't provide the build mode but we can use
      // the NODE_ENV environment variable instead.
      if (process.env.NODE_ENV === 'production') {
        code = SplittingMinifier.minify(code);
      }

      // We can use one input file to generate an arbitrary number of assets
      inputFiles[0].addAsset({
        data: code,
        path: `../../bundle${bundle.id}.js`
      });
    }

    bundle.children.forEach(childBundle => {
      this.emitBundles(childBundle, inputFiles)
    });
  }
}

global.SplittingCompiler = SplittingCompiler;
