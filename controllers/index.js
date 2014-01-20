var db = require('../models/');
module.exports.controller = function(app) {
    // routes
    db.Room.all()
        .success(
            function (rooms) {
                app.get(
                    '/',
                    function(req, res) {
                        res.render(
                            'index',
                            {
                                title: 'Hello, World!',
                                rooms: rooms
                            }
                        );
                    }
                );
            }
        );
}
