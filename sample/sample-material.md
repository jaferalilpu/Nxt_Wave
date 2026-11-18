# Variables and scope in JavaScript

## What a variable is

A variable is a named container that holds a value your program can use later. You create one with a declaration keyword, give it a name and, usually, an initial value. Modern JavaScript has three declaration keywords: `var`, `let` and `const`.

```js
let score = 10;
score = score + 5;
console.log(score); // 15
```

## let and const

Use `let` when the value will change later, such as a score or a counter. Use `const` when the value should never be reassigned after it is set. Trying to reassign a `const` variable throws a `TypeError`.

```js
const siteName = "Learn Code";
siteName = "Other"; // TypeError: Assignment to constant variable
```

A `const` variable must be given a value at the moment it is declared. Declaring `const` without a value is a `SyntaxError`.

## Block scope

Variables declared with `let` and `const` are **block scoped**, which means they only exist inside the pair of curly braces where they were declared. Code outside that block cannot see them.

```js
if (true) {
  let message = "hello";
  console.log(message); // hello
}
console.log(message); // ReferenceError: message is not defined
```

A `ReferenceError` is thrown when your code uses a name that does not exist in the current scope.

## Why var causes surprises

Variables declared with `var` are **function scoped**, not block scoped. A `var` declared inside an `if` block is still visible after the block ends, which often leads to bugs for beginners.

```js
if (true) {
  var city = "Hyderabad";
}
console.log(city); // Hyderabad
```

Because of this, most style guides recommend using `const` by default and `let` only when you need to reassign. The `var` keyword is mainly seen in older code.

## Hoisting in one line

Declarations made with `var` are **hoisted**, which means JavaScript moves the declaration to the top of its function before running the code, although the value is not moved with it. Reading a hoisted `var` before it is assigned gives `undefined`.
