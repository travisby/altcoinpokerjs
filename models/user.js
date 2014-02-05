module.exports = function (mongoose) {
    var model = null;
    var collection = 'users';
    var Schema = mongoose.Schema;
    var ObjectId = Schema.ObjectId;

    var schema = new mongoose.Schema(
        {
            username: String
        }
    );
    model = mongoose.model(collection, schema);

    return model;
};
