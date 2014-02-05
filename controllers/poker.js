module.exports.controller = function(app) {
    var db = app.mongoose;
    var game = require('../game.js');
    // routes
    app.get(
        '/poker/:id',
        function (req, res) {
            db.Room.findById(
                req.params.id,
                function (err, room) {
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
            db.Currency.findById(
                req.body.currencyID,
                function (err, currency) {
                    var room = null;
                    var deck = null;
                    if (err) {
                        throw err;
                    }

                    deck = new game.PokerDeck();
                    deck.shuffle();
                    room = new db.Room();
                    room.deck = deck;
                    room.name = req.body.name;
                    room.buyin = req.body.buyin;
                    room.currency = currency;
                    room.save(
                        function (err) {
                            if (err) {
                                throw err;
                            }
                            console.log("Created room " + room.id);
                            res.redirect('/poker/' + room.id);
                        }
                    );
                    
                }
            );
        }
    );
};
