var db = require('../models/');
module.exports.controller = function(app) {
    // routes
    app.get(
        '/poker',
        function (req, res) {
            db.Room.find(req.params.id)
            .success(
                function(room) {
                    res.render(
                        'poker',
                        {
                            room: room
                        }
                    );
                }
            );
        }
    );

    app.post(
        '/poker/new',
        function (req, res) {
            db.Currency.find(req.body.currencyID)
            .success(
                function (currency) {
                    db.Room.create(
                        {
                            name: req.body.name,
                            buyin: req.body.buyin
                        }
                    ).complete(
                        function (err, room) {
                            if (err) {
                                console.log(err);
                                throw err;
                            } else {
                                room.setCurrency(currency);
                                console.log("Created room " + room.id);
                                res.redirect('/poker?id=' + room.id);
                            }
                        }
                    );
                }
            );
        }
    );
};
