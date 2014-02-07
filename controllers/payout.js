var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

module.exports.controller = function(app) {
    var db = app.mongoose;
    // routes
    app.get(
        '/payout/new',
        ensureLoggedIn('/login'),
        function (req, res) {
            db.Currency.find(
                {},
                function (err, currencies) {
                    if (err) {
                        throw err;
                    }
                    res.render(
                        'payout_new',
                        {
                            currencies: currencies,
                            user: req.user
                        }
                    );
                }
            );
        }
    );
    app.post(
        '/payout/new',
        ensureLoggedIn('/login'),
        function(req, res) {
            var payout = new db.Payout();
            var user = req.user;
            db.Currency.findById(req.body.currencyID).populate('payouts').exec(
                function (err, currency) {
                    if (err) {
                        throw err;
                    }

                    // TODO check if address exists already
                    if (false) {
                        throw "This address already exists";
                    }

                    payout.address = req.body.address;
                    payout.user = user;
                    payout.currency = currency;
                    // TODO remove this test code please
                    payout.value = 1000;
                    payout.save(
                        function (err, payout, numberAffected) {
                            if (err) {
                                throw err;
                            }
                            currency.wallets.push(payout);
                            currency.save(
                                function (err, currency, numberAffected) {
                                    if (err) {
                                        throw err;
                                    }
                                    user.payouts.push(payout);
                                    user.save(
                                        function (err, currency, numberAffected) {
                                            if (err) {
                                                throw err;
                                            }
                                        }
                                    );
                                }
                            );
                        }
                    );

                }
            );
            res.redirect('/');
        }
    );
};
