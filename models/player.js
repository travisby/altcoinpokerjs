module.exports = function (mongoose) {
    var collection = 'players';

    var schema = new mongoose.Schema(
        {
            hand: String,
            money: Number,
            room: {type: mongoose.Schema.ObjectId, ref: 'rooms'},
            user: {type: mongoose.Schema.ObjectId, ref: 'users'},
        }
    );

    return mongoose.model(collection, schema);
};
