var db = require('../models/');
module.exports.controller = function(app) {
    // routes
    app.get(
        '/',
        function(req, res) {
            db.Currency.all()
            .success(
                function (coins) {
                    db.Room.all()
                    .success(
                        function (rooms) {
                            res.render(
                                'index',
                                {
                                    title: 'Hello, World!',
                                    rooms: rooms,
                                    coins: coins
                                }
                            );
                        }
                    );
                }
            );
        }
    );
};
