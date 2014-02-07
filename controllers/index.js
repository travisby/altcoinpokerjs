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
                            var obj = {
                                title: 'Welcome to CryptoPoker!',
                                rooms: rooms,
                                coins: coins
                            };
                            if (req.user) {
                                obj.user = req.user;
                                db.Payout.where('user', req.user.id).populate('currency').exec(
                                    req.user._id,
                                    function (err, payouts) {
                                        if (err) {
                                            throw err;
                                        }
                                        obj.payouts = payouts;
                                        res.render(
                                            'index',
                                            obj
                                        );
                                    }
                                );
                            } else {
                                res.render(
                                    'index',
                                    obj
                                );
                            }
                        }
                    );
                }
            );
        }
    );
};
