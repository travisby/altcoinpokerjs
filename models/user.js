module.exports = function (mongoose) {
    var collection = 'users';

    var schema = new mongoose.Schema(
        {
            username: String,
            players: [{type: mongoose.Schema.ObjectId, ref: 'players'}],
            payouts: [{type: mongoose.Schema.ObjectId, ref: 'payouts'}]
        }
    );

    return mongoose.model(collection, schema);
};
