'use strict';

Plugin.registerCompiler({
  extensions: ['js', 'jsx'],
}, function () {
  return new SplittingCompiler();
});

Plugin.registerMinifier({
  extensions: ['js'],
  archMatching: 'web'
}, function () {
  return new SplittingMinifier();
});
