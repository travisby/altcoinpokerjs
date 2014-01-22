module.exports.all = function (callback, arr) {
    arr.map(callback).reduce(
        function (previousValue, currentValue, index, array) {
            if (!previousValue) {
                return previousValue;
            } else {
                return previousValue
            }
        }
    );
}
