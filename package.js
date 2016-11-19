Package.describe({
  name: 'klaussner:code-splitting',
  version: '0.0.1',
  summary: 'Experimental code splitting build plugin for Meteor',
  git: 'https://github.com/klaussner/code-splitting'
});

Package.registerBuildPlugin({
  name: 'code-splitting',
  use: ['babel-compiler', 'minifier-js'],
  sources: [
    'plugin.js',
    'SplittingCompiler.js',
    'SplittingMinifier.js',
    'Bundle.js',
    'bundleRuntime.js',
  ],
  npmDependencies: {
    babylon: '6.13.1',
    recast: '0.11.17'
  }
});

Package.onUse(function (api) {
  api.use('isobuild:compiler-plugin@1.0.0');
  api.use('isobuild:minifier-plugin@1.0.0');

  api.use('babel-compiler');

  // These are copied from the ecmascript plugin:
  api.imply('modules');
  api.imply('ecmascript-runtime');
  api.imply('babel-runtime');
  api.imply('promise');
});
