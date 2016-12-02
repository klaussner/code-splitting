# Code Splitting

This package provides an experimental code splitting build plugin for Meteor.
**It's just a proof of concept and has some drawbacks that make it useless for real applications (see below)!**

# Installation

You have to replace the default JavaScript compiler and minifier packages:

```diff
+ klaussner:code-splitting
- standard-minifier-js
- ecmascript
```

# How it works

The compiler plugin in this package parses each client JavaScript file and looks for `async` functions that import other JavaScript files.
For each of these functions, it generates a new bundle–a set of JavaScript files that will be loaded from the server on demand. For example:

```js
// /imports/module.js
export default "I'm a module";

// client.js
async function loadAsync() {
  import value from '/imports/module.js';
  console.log(value);
}

loadAsync();
console.log("I'm eagerly loaded");
```

The eagerly loaded `client.js` becomes part of the default bundle, which is always loaded.
It imports a module in the `loadAsync` function, so the compiler will generate a separate bundle, which is downloaded as soon as `loadAsync` is called.
The compiler does this by inserting additional logic for downloading the bundle and delaying execution until it's available.

See [WHY_NEST_IMPORTS.md in benjamn/reify](https://github.com/benjamn/reify/blob/master/WHY_NEST_IMPORTS.md#automatic-code-splitting) for a detailed explanation of this concept.

# Drawbacks

* Packages from npm and assets (e.g., Sass and HTML files) that are imported from JavaScript files always become part of the default bundle
* Generates more code than necessary
* Replaces two core Meteor packages
* Limited optimization capabilities
* No source maps
