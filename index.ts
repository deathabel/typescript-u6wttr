/**
 *
 */
const shoesPrices = [100, 80];
const totalPrice = (...prices) => prices.reduce((pre, cur) => pre + cur, 0);
const discount = (price, off) => price * ((100 - off) / 100);
console.log(discount(totalPrice(...shoesPrices), 10));

const totalPriceCurrying =
  (startPrice) =>
  (...prices) =>
    startPrice + totalPrice(...prices);
const discountCurrying = (off) => (price) => discount(price, off);
const calculate =
  (...formula) =>
  (...prices) =>
    formula.reduce(
      (prices, formulaFn) =>
        formulaFn(...(Array.isArray(prices) ? prices : [prices])),
      prices
    );

const totalPriceCalculate = calculate(
  totalPriceCurrying(0),
  discountCurrying(10)
);

console.log(totalPriceCalculate(...shoesPrices));

const clothesPrices = [1000, 800];
// different discount shoe 10, cloth 20 off
// total discount 10 off
console.log(
  discount(
    totalPrice(
      discount(totalPrice(...shoesPrices), 10),
      discount(totalPrice(...clothesPrices), 20)
    ),
    10
  )
);

const shoesPriceCalcuate = calculate(
  totalPriceCurrying(0),
  discountCurrying(10)
);

const clothesPriceCalcuate = calculate(
  totalPriceCurrying(0),
  discountCurrying(20)
);

console.log(
  totalPriceCalculate(
    shoesPriceCalcuate(...shoesPrices),
    clothesPriceCalcuate(...clothesPrices)
  )
);
