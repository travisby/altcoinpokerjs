module.exports = function (mongoose) {
    var model = null;
    var collection = 'currency';
    var Schema = mongoose.Schema;
    var ObjectId = Schema.ObjectId;

    var schema = new mongoose.Schema(
        {
            hand: String,
            money: Number
        }
    );
    model = mongoose.model(collection, schema);

    return model;
};
