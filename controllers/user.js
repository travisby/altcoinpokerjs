// https://github.com/saintedlama/passport-local-mongoose/blob/master/examples/login/routes.js
module.exports.controller = function(app, passport) {
    var db = app.mongoose;
    // routes
    app.get(
        '/register',
        function (req, res) {
            res.render(
                'register',
                {}
            );
        }
    );

    app.post(
        '/register',
        function (req, res) {
            db.User.register(
                new db.User(
                    {
                        username: req.body.username
                    }
                ),
                req.body.password,
                function (err, user) {
                    if (err) {
                        return res.render(
                            'register',
                            {
                                user: user
                            }
                        );
                    }
                    res.redirect('/');
                }
            );
        }
    );

    app.get(
        '/login',
        function (req, res) {
            res.render(
                'login',
                {
                    user: req.user
                }
            );
        }
    );

    app.post(
        '/login',
        passport.authenticate('local'),
        function (req, res) {
            res.redirect('/');
        }
    );

    app.get(
        '/logout',
        function (req, res) {
            req.logout();
            res.redirect('/');
        }
    );
};
