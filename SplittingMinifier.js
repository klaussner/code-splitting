'use strict';

class SplittingMinifier {
  processFilesForBundle(files, options) {
    const mode = options.minifyMode;

    if (mode === 'development') {
      this.processForDevelopment(files);
    } else {
      this.processForProduction(files);
    }
  }

  processForDevelopment(files) {
    files.forEach(file => {
      const path = file.getPathInBundle();
      let data, sourceMap;

      if (path === 'app/app.js') {
        data = meteorBundleRuntime(true) + file.getContentsAsString();
      } else {
        data = file.getContentsAsBuffer();
        sourceMap = file.getSourceMap();
      }

      file.addJavaScript({
        data, sourceMap, path
      });
    });
  }

  processForProduction(files) {
    let code = '';

    files.forEach(file => {
      const path = file.getPathInBundle();
      let moduleCode = file.getContentsAsString();

      if (/\.min\.js$/.test(path)) {
        code += moduleCode;
      } else {
        if (path === 'app/app.js') {
          moduleCode = meteorBundleRuntime() + moduleCode;
        }

        code += SplittingMinifier.minify(moduleCode);
      }
    });

    if (files.length) {
      files[0].addJavaScript({ data: code });
    }
  }
}

SplittingMinifier.minify = function (code) {
  return UglifyJSMinify(code, {
    fromString: true,
    compress: {
      drop_debugger: false,
      unused: false,
      dead_code: false
    }
  }).code;
};

global.SplittingMinifier = SplittingMinifier;
