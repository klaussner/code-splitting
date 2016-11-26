async function f() {
  import value from '/imports/a.js';
  return value;
}

console.log('Calling async function with import…');

f().then(value => console.log(value));
