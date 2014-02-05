module.exports.controller = function(app) {
    var db = app.mongoose;
    // routes
    app.post(
        '/currency/new',
        function(req, res) {
            var newCurrency = new db.Currency();
            newCurrency.name = req.body.name;
            newCurrency.symbol = req.body.symbol;
            newCurrency.save(
                function (err) {
                    if (err) {
                        throw err;
                    }
                }
            );
            res.redirect('/');
        }
    );
};
