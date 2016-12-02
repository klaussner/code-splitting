Package.describe({
  name: 'klaussner:code-splitting',
  version: '0.0.3',
  summary: 'Experimental code splitting build plugin for Meteor',
  git: 'https://github.com/klaussner/code-splitting'
});

Package.registerBuildPlugin({
  name: 'code-splitting',
  use: ['babel-compiler@6.13.0', 'minifier-js@1.2.15'],
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

  // These are copied from the ecmascript plugin:
  api.imply('modules@0.7.7');
  api.imply('ecmascript-runtime@0.3.15');
  api.imply('babel-runtime@1.0.1');
  api.imply('promise@0.8.8');
});
