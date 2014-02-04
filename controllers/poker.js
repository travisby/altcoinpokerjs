var db = require('../models/');
var game = require('../game.js');
module.exports.controller = function(app) {
    // routes
    app.get(
        '/poker/:id',
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
                    var deck = new game.PokerDeck();
                    deck.shuffle();
                    db.Room.create(
                        {
                            name: req.body.name,
                            buyin: req.body.buyin,
                            deck: deck
                        }
                    ).complete(
                        function (err, room) {
                            if (err) {
                                console.log(err);
                                throw err;
                            } else {
                                room.setCurrency(currency);
                                console.log("Created room " + room.id);
                                res.redirect('/poker/' + room.id);
                            }
                        }
                    );
                }
            );
        }
    );
};
