var db = require('../models/');
module.exports.controller = function(app) {
    // routes
    app.get(
        '/poker',
        function(req, res) {
            db.Room.find(req.params.id)
            .success(
                function(room) {
                    res.render(
                        'poker',
                        {
                            room: room
                        }
                    );
                }
            );
        }
    );
};
