
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var socketio = require('socket.io');
var fs = require('fs');
var game = require('./game.js');
var mongoose = require('mongoose');
var uristring = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/cryptopoker';

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

var models = {};
models.Currency = require('./models/currency.js')(mongoose);
models.Payout = require('./models/payout.js')(mongoose);
models.Player = require('./models/player.js')(mongoose);
models.Room = require('./models/room.js')(mongoose);
models.User = require('./models/user.js')(mongoose);

app.mongoose = models;

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// dynamic controllers
fs.readdirSync('./controllers')
.forEach(
    function (file) {
        if(file.substr(-3) == '.js') {
            route = require('./controllers/' + file);
            route.controller(app);
        }
    }
);

mongoose.connect(
    uristring,
    function (err, res) {
        if (err) {
            throw err;
        } else {
            server = http.createServer(app);
            socketio = socketio.listen(server);
            // add events to socketio
            game.game(socketio, models);
            server.listen(app.get('port'), function () {
              console.log('Express server listening on port ' + app.get('port'));
            });
        }
    }
);
