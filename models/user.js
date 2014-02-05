module.exports = function (mongoose) {
    var passportLocalMongoose = require('passport-local-mongoose');
    var collection = 'users';

    var schema = new mongoose.Schema(
        {
            players: [{type: mongoose.Schema.ObjectId, ref: 'players'}],
            payouts: [{type: mongoose.Schema.ObjectId, ref: 'payouts'}]
        }
    );

    schema.plugin(
        passportLocalMongoose,
        {
        }
    );

    return mongoose.model(collection, schema);
};
