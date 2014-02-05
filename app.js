
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
var passport = require('passport');
var SECRET = process.env.SESSION_SECRET || "G17HKGJxb4D|6>)g8ESYtqi3B7pWc@AD'HToKp8#[>c&qR8+C/`JQ$VDClx52g/";

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
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({secret: SECRET}));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);

var models = {};
models.Currency = require('./models/currency.js')(mongoose);
models.Payout = require('./models/payout.js')(mongoose);
models.Player = require('./models/player.js')(mongoose);
models.Room = require('./models/room.js')(mongoose);
models.User = require('./models/user.js')(mongoose);
passport.use(models.User.createStrategy());
passport.serializeUser(models.User.serializeUser());
passport.deserializeUser(models.User.deserializeUser());

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
            route.controller(app, passport);
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
