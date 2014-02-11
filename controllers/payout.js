var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
var WALLET_NOT_FOUND = "Wallet not found";
var NOT_OWN_WALLET = "Not own wallet";
var WALLET_NOT_EMPTY = "Wallet not empty";

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

    app.delete(
        '/payout/:id',
        ensureLoggedIn('/login'),
        function (req, res) {
            db.Payout.findById(req.params.id).populate('currency').populate('user').exec(
                function (err, payout) {
                    if (err) {
                        throw err;
                    }

                    if (!payout) {
                        res.status(404).send();
                        return;
                        // throw WALLET_NOT_FOUND;
                    }

                    var currency = payout.currency;
                    var user = req.user;

                    if (payout.user.id !== req.user.id) {
                        res.status(401).send();
                        return;
                        // throw NOT_OWN_WALLET;
                    }

                    if (payout.value > 0) {
                        res.status(403).send();
                        return;
                        // throw WALLET_NOT_EMPTY;
                    }
                    // remove from currency
                    currency.wallets.slice(currency.wallets.indexOf(payout.id), 1);
                    currency.save(
                        function (err, currency, numAffected) {
                            if (err) {
                                throw err;
                            }
                            // remove from user
                            user.payouts.slice(user.payouts.indexOf(payout.id), 1);
                            user.save(
                                function (err, user, numAffected) {
                                // finally remove the payout
                                payout.remove(
                                    function (err, payout) {
                                        if (err) {
                                            throw err;
                                        }
                                        res.send(200);
                                    }
                                );
                                }
                            );
                        }
                    );

                }
            );
        }
    );
};
