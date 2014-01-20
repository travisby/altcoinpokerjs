var db = require('../models/');
module.exports.controller = function(app) {
    // routes
    app.post(
        '/currency/new',
        function(req, res) {
            db.Currency.create(
                {
                    name: req.body.name,
                    symbol: req.body.symbol
                }
            ).complete(
                function (err, currency) {
                    if (err) {
                        console.log(err);
                        throw err
                    } else {
                        console.log("created " + currency.id);
                        res.redirect('/');
                    }
                }
            );
        }
    );
};
