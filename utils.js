module.exports.all = function (callback, arr) {
    return arr.map(callback).reduce(
        function (previousValue, currentValue, index, array) {
            if (!previousValue) {
                return previousValue;
            } else {
                return currentValue;
            }
        }
    );
};

module.exports.any = function (callback, arr) {
    return arr.map(callback).reduce(
        function (previousValue, currentValue, index, array) {
            if (previousValue) {
                return previousValue;
            } else {
                return currentValue;
            }
        }
    );
};
