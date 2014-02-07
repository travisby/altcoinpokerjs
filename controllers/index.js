module.exports.controller = function(app) {
    var db = app.mongoose;
    // routes
    app.get(
        '/',
        function(req, res) {
            res.render(
                'index',
                {
                    title: 'Welcome to CryptoPoker!'
                }
            );
        }
    );
};
