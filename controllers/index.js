module.exports.controller = function(app) {
    var db = app.mongoose;
    // routes
    app.get(
        '/',
        function(req, res) {
            db.Room.find(
                {},
                function (error, rooms) {
                    db.Currency.find(
                        {},
                        function (error, coins) {
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
