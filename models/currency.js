module.exports = function (mongoose) {
    var collection = 'currencies';
    var schema = new mongoose.Schema(
        {
            name: String,
            symbol: String,
            wallets: [{ type: mongoose.Schema.ObjectId, ref: 'payouts'}],
            rooms: [{ type: mongoose.Schema.ObjectId, ref: 'rooms'}]
        }
    );
    return mongoose.model(collection, schema);
};
