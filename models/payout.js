module.exports = function (mongoose) {
    var collection = 'payouts';

    var schema = new mongoose.Schema(
        {
            address: String,
            value: Number,
            user: {type: mongoose.Schema.ObjectId, ref: 'users'},
            currency: {type: mongoose.Schema.ObjectId, ref: 'currencies'}
        }
    );

    return mongoose.model(collection, schema);
};
