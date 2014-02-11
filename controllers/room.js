var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

module.exports.controller = function(app) {
    var db = app.mongoose;
    var game = require('../game.js');
    // routes

    // list rooms
    app.get(
        '/room',
        function (req, res) {
            db.Room.find({}).exec(
                function (err, rooms) {
                    if (err) {
                        throw err;
                    }
                    res.render(
                        'room_list',
                        {
                            rooms: rooms,
                            user: req.user
                        }
                    );
                }
            );
        }
    );
    app.get(
        '/room/:id',
        ensureLoggedIn('/login'),
        function (req, res) {
            db.Room.findById(
                req.params.id,
                function (err, room) {
                    res.render(
                        'room',
                        {
                            room: room,
                            user: req.user
                        }
                    );
                }
            );
        }
    );

    app.post(
        '/room/new',
        ensureLoggedIn('/login'),
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
                            res.redirect('/room/' + room.id);
                        }
                    );
                    
                }
            );
        }
    );
};
