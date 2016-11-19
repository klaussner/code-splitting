'use strict';

class SplittingMinifier {
  processFilesForBundle(files, options) {
    const mode = options.minifyMode;

    if (mode === 'development') {
      files.forEach(file => {
        const path = file.getPathInBundle();

        if (path === 'app/app.js') {
          const code = file.getContentsAsString();

          file.addJavaScript({
            data: meteorBundleRuntime(true) + code,
            path
          });
        } else {
          file.addJavaScript({
            data: file.getContentsAsBuffer(),
            sourceMap: file.getSourceMap(),
            path
          });
        }
      });

      return;
    }

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
