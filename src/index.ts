import cloneDeep from 'lodash/cloneDeep';
import bigNumber from 'bignumber.js';

bigNumber.set({ DECIMAL_PLACES: 18 });


// Modifies the given obj parameter
// by reassigning the properties and their values
// keeping the original reference
function modify(obj, newObj) {
    Object.keys(obj).forEach(function(key) {
        delete obj[key];
    });
    Object.keys(newObj).forEach(function(key) {
        obj[key] = newObj[key];
    });
}

const makeIterator = (list, next, getter, setter) => {
    const clonedList = cloneDeep(list);
    return {
        [Symbol.iterator]: () => {
            const modifySetter = (item, index, value) => {
                if (typeof item === 'object') {
                    modify(item, setter(item, value))
                } else {
                    clonedList[index] = setter(item, value);
                }
            };

            return { next: (function() {
                    const { list, index, getter, setter } = this;
                    const item = next(list, index);
                    if (!list || (Array.isArray(list) && !list.length) || !item) {
                        return { done: true };
                    }
                    this.index += 1;
                    return {
                        value: { get: getter.bind(null, item), set: modifySetter.bind(null, item, index), item },
                        done: false,
                    }
                }).bind({ list: clonedList, next, getter, setter, index: 0 })}
        },
        result: clonedList
    };
};

const getProportionalValue = (value, valueToDistribute, total) => {
    if (!total || !value) return 0;
    if (total === value) return valueToDistribute;
    return new bigNumber(valueToDistribute)
      .dividedBy(total)
      .multipliedBy(value);
};

const sum = (values, precision) => +values.reduce((acc, v) => acc.plus(v), new bigNumber(0)).decimalPlaces(precision);

export const distributeProportionalValue = (data, next, getter, setter, options) => {
    const defaultOptions = { precision: 2 };
    const { precision, distribute } = Object.assign(defaultOptions, options);
    const iterator = makeIterator(data, next, getter, setter);
    const iterable = Array.from(iterator);
    const values = iterable.map(({ get }) => get());
    const total = sum(values, precision);

    const distributedValues = values.map(v => +new bigNumber(getProportionalValue(v, distribute, total)).decimalPlaces(precision));
    const diff = new bigNumber(distribute).minus(sum(distributedValues, precision));

    if (!diff.isEqualTo(0)) {
        const maxValueIndex = distributedValues.indexOf(Math.max(...distributedValues));
        distributedValues[maxValueIndex] = +new bigNumber(distributedValues[maxValueIndex]).plus(diff);
    }
    iterable.forEach(({ set }) => set(distributedValues.shift()));
    return iterator.result;
};