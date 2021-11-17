import { expect } from 'chai';
import bigNumber from 'bignumber.js';

import { distributeProportionalValue } from '../src'

bigNumber.set({ DECIMAL_PLACES: 18 });
const random = () => +(Math.random() * 100).toFixed(2);


describe('distributeProportionalValue', () => {
  it('should distribute discount per items', () => {
    const bundle = {
      itemTypes: [
        {items: [{price: 1.1}, {price: 0.35}, {price: 2.98}]},
        {items: [{price: 2.32}, {price: 12.11}, {price: 11.11}]},
        {items: [{price: 3.31}]},
        {items: [{price: 2.54}]},
      ]
    };

    const getBundleItems = bundle => {
      const itemTypes = bundle.itemTypes;
      const items = itemTypes.map(({items}) => items);
      return [].concat.apply([], items);
    };

    const bundleWithDistributedItemsDiscounts = distributeProportionalValue(
      bundle,
      (bundle, index) => getBundleItems(bundle)[index],
      item => item.price,
      (item, discount) => ({...item, discount}),
      {distribute: 11.2},
    );

    expect(bundleWithDistributedItemsDiscounts).to.deep.equal({
      "itemTypes": [
        {
          "items": [
            {
              "discount": 0.34,
              "price": 1.1
            },
            {
              "discount": 0.11,
              "price": 0.35
            },
            {
              "discount": 0.93,
              "price": 2.98
            }
          ]
        },
        {
          "items": [
            {
              "discount": 0.73,
              "price": 2.32
            },
            {
              "discount": 3.8,
              "price": 12.11
            },
            {
              "discount": 3.47,
              "price": 11.11
            }
          ]
        },
        {
          "items": [
            {
              "discount": 1.03,
              "price": 3.31
            }
          ]
        },
        {
          "items": [
            {
              "discount": 0.79,
              "price": 2.54
            }
          ]
        }
      ]
    });
  });

  it('should match finalPrices with total amount', () => {
    for (let i = 0; i < 100; i++) {
      const bundles = [
        { price: random(), finalPrice: 0 },
        { price: random(), finalPrice: 0 },
        { price: random(), finalPrice: 0 },
      ];
      const expectedPrice = +new bigNumber(random());

      const bundlesWithDistributedPrice = distributeProportionalValue(
        bundles,
        (list, index) => list[index],
        bundle => bundle.price,
        (bundle, finalPrice) => ({...bundle, finalPrice}),
        {distribute: expectedPrice},
      );

      const sumFinalPrices = +bundlesWithDistributedPrice
        .reduce((acc, { finalPrice }) => acc.plus(finalPrice), new bigNumber(0));
      expect(sumFinalPrices).to.deep.equal(expectedPrice);
    }
  });
});