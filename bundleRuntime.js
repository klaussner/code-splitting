'use strict';

function message(text) {
  const css1 = 'background: salmon; color: white';
  const css2 = 'color: salmon';

  return `console.log("%ccode splitting%c " + ${text}, '${css1}', '${css2}');`;
}

global.meteorBundleRuntime = function (debug) {
  let waiting, loaded, alreadyLoaded;

  if (debug) {
    waiting = message('"waiting for bundle " + bundleId');
    loaded = message('"bundle " + bundleId + " loaded"');
    alreadyLoaded = message('"bundle " + bundleId + " already loaded"');
  } else {
    waiting = loaded = alreadyLoaded = '';
  }

  return (
`var meteorModuleStubs = {};
var meteorBundlePromises = {};

function meteorEnsureBundle(bundleId) {
  ${waiting}
  var promise = meteorBundlePromises[bundleId];

  if (promise) {
    ${alreadyLoaded}
    return promise;
  }

  promise = new Promise(function (resolve) {
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
