var arr = Array(10)
  .fill(0)
  .map((m, i) => m + i);
var eArr = arr[Symbol.iterator]();

var result = arr
  .filter((m) => {
    console.log(`filter ${m}`);
    return m % 2 === 0;
  })
  .map((m) => {
    console.log(`map ${m}`);
    return m;
  });

console.log('new filter');

Array.prototype._iterator = {
  funcs: [],
};

Array.prototype.filter = function (func) {
  this._iterator.funcs.push((value) => (func(value) ? value : undefined));
  return this;
};

Array.prototype.map = function (func) {
  this._iterator.funcs.push(func);
  return this;
};

Array.prototype.result = function () {
  var arrResult = [];
  const arrIterators = this[Symbol.iterator]();
  for (var value of arrIterators) {
    var result = value;
    const funcIterators = this._iterator.funcs[Symbol.iterator]();
    for (var func of funcIterators) {
      result = func.call(this, result);
      if (result === undefined) break;
    }
    if (result !== undefined) arrResult.push(result);
  }
  return arrResult;
};

console.log(
  arr
    .filter((m) => {
      console.log(`filter ${m}`);
      return m % 2 === 0;
    })
    .map((m) => {
      console.log(`map ${m}`);
      return m;
    })
    .result()
);
