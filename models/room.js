module.exports = function (mongoose) {
    var collection = 'rooms';

    var schema = new mongoose.Schema(
        {
            name: String,
            buyin: Number,
            currency: {type: mongoose.Schema.ObjectId, ref: 'currencies'},
            players: [{type: mongoose.Schema.ObjectId, ref: 'players'}]
        }
    );

    return mongoose.model(collection, schema);
};
