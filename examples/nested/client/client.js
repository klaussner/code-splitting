async function f() {
  async function g() {
    import b from '/imports/b.js';
    console.log(b);
  }

  g();

  import a from '/imports/a.js';
  console.log(a);
}

f();
