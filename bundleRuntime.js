'use strict';

function message(text) {
  return `console.log("code splitting:", ${text});`;
}

global.meteorBundleRuntime = function (debug) {
  let waiting, loaded;

  if (debug) {
    waiting = message('"waiting for bundle " + bundleId');
    loaded = message('"bundle " + bundleId + " loaded"');
  } else {
    waiting = loaded = '';
  }

  return (
`var meteorModuleStubs = {};
var meteorBundlePromises = {};

function meteorEnsureBundle(bundleId) {
  ${waiting}
  var existingPromise = meteorBundlePromises[bundleId];

  if (existingPromise) {
    return existingPromise;
  }

  var promise = new Promise(function (resolve) {
    var script = document.createElement("script");

    script.onload = function () {
      ${loaded}
      resolve();
    };

    script.src = "/bundle" + bundleId + ".js";
    document.head.appendChild(script);
  });

  meteorBundlePromises[bundleId] = promise;

  return promise;
}\n\n`);
};
