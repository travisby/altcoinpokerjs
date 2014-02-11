var stringToCardCharacter = function (cardString) {
    // this is the value of the back of a card
    var decimalValue = 127136;
    var rankCharacter = cardString.charAt(0);
    var suitCharacter = cardString.charAt(1);

    // must be trying to get the back of a card!
    if (cardString === '') {
        return '&#' + decimalValue;
    }

    switch (suitCharacter) {
        case 'c':
            decimalValue += 48;
            break;
        case 'd':
            decimalValue += 32;
            break;
        case 'h':
            decimalValue += 16;
            break;
        case 's':
            decimalValue += 0;
            break;
        default:
            decimalValue += 0;
            break;
    }

    if (rankCharacter === 'A') {
        decimalValue += 1;
    } else if (rankCharacter === 'K') {
        decimalValue += 14;
    } else if (rankCharacter === 'Q') {
        decimalValue += 13;
    } else if (rankCharacter === 'J') {
        decimalValue += 12;
    } else if (rankCharacter === 'T') {
        decimalValue += 10;
    } else {
        // in this case, we must be numeric
        decimalValue += parseInt(rankCharacter);
    }

    return '&#' + decimalValue;

};

// graphic objects
var pokerTable = PIXI.Sprite.fromImage('/vendor/imgs/poker_table.png'); 
var deck = new PIXI.Text($('<div />').html(stringToCardCharacter('')).text());
var readyButton = new PIXI.Text('Ready');
var checkOrFold = new PIXI.Text('Check/Fold');
var betOrRaise = new PIXI.Text('Bet/Raise');

// objects used elsewhere
var cards = [];
var animations = [];


/**
 * Player object to send down in an event
 *
 * @typedef {String} eventPlayer - username
 *
 */

/*
 *
 * Betting Object Type Declaration
 *
 * @typedef {Object} eventBet
 *
 * @property {Number} amount - number of coins to bet
 * @property {eventPlayer} player - the player that bet
 */



// events

/**
 * Event for users connecting to the socketio socket
 *
 * @event connection
 */
var connection = 'connection';

/**
 * Event for ANOTHER user joining our game
 *
 * @event playerSatDown
 * @type {eventPlayer}
 */
var playerSatDown = 'playerSatDown';


/**
 * Event to tell who needs to ante
 *
 * @event playersNeedToAnte
 *
 * @type {Player[]}
 */
var playersNeedToAnte = 'playersNeedToAnte';

/**
 * Event to tell the room that a player has anted
 *
 * @event playerPaidAnte
 *
 * @type {Player}
 */
var playerPaidAnte = 'playerPaidAnte';

/**
 * Event to tell the room that the dealer has dealt hole cards to every player
 *
 * @event dealerDealtHoleCards
 * @type {String[]}
 */
var dealerDealtHoleCards = 'dealerDealtHoleCards';

/**
 * Event to tell the room a player has bet
 *
 * @event playerBet
 *
 * @type {eventBet}
 */
var playerBet = 'playerBet';

/**
 * Event to tell the room who has to bet next
 *
 * @event playerNeedsToBet
 *
 * @type {eventBet}
 */
var playerNeedsToBet = 'playerNeedsToBet';

/**
 * Event to tell the room the dealer dealt the community cards
 *
 * @event dealerDealtCommunityCards
 *
 * @type {String[]}
 */
var dealerDealtCommunityCards = 'dealerDealtCommunityCards';

/**
 * Event to tell the room which player won
 *
 * @event playerWon
 *
 * @type {eventPlayer}
 */
var playerWon = 'playerWon';

/**
 * Event to tell the board the game has been reset
 *
 * @event dealerResetGame
 *
 */
var dealerResetGame = 'dealerResetGame';

/**
 * Event to broadcast that a player has quit
 *
 * @event playerLeft
 *
 * @type {eventPlayer}
 */
var playerLeft = 'playerLeft';


/**
 * Event to tell update a player about what's going on in the game when they joined
 *
 * @event youSatDown
 *
 * @type {eventPlayer[]}
 */
var youSatDown = 'youSatDown';

/**
 * Event to tell the server you're joining our fun game
 *
 * @event iSatDown
 */
var iSatDown = 'iSatDown';

/**
 * Event to tell the server a player has bet
 *
 * @event iBet
 *
 * @type {Number} - amount
 */
var iBet = 'iBet';

/**
 * Event to tell the player I left the game
 *
 * @event iLeft
 */
var iLeft = 'disconnect';





/**
 * Card object
 *
 * @constructor
 * @param {String} str - the string making a particular card up
 */
var Card = function (str) {
    this.sprite = new PIXI.Text($('<div />').html(stringToCardCharacter(str)).text());
};

/**
 * Contains the PIXI sprite for us to use
 *
 * @propertyof! Card
 * @type PIXI.Sprite
 */
Card.prototype.sprite = null;

/**
 * Animate this card to position point over time frames
 *
 * @propertyof Card
 * @method
 * @param {PIXI.Point} point - the point we are moving to
 * @param {Number} frames - how many frames should it take to get there?
 * @param {Number} startIn - number of frames to stagger
 */
Card.prototype.animateTo = function (point, frames, startIn) {
    var amount = new PIXI.Point();
    var thisCard = this;
    amount.x = (point.x - this.sprite.position.x) / frames;
    amount.y = (point.y - this.sprite.position.y) / frames;

    var animateFunction = function (amount, times, startIn) {
        // defer
        if (startIn > 0) {
            animations.push([animateFunction, thisCard, [amount, times, startIn - 1]]);
            return;
        }

        // we're done
        if (times < 0) {
            return;
        }
        thisCard.sprite.position.x += amount.x;
        thisCard.sprite.position.y += amount.y;
        animations.push([animateFunction, thisCard, [amount, times - 1, 0]]);
    };

    animateFunction(amount, frames, startIn);
};

/**
 * Player
 *
 * @constructor
 * @param {UserObj} userObj
 */
var Player = function (userObj) {
    Player.players.push(this);

    // Decide their place on the webgl board
    switch (Player.players.length) {
        case 1:
            this.position = new PIXI.Point(100, 200);
            break;
        case 2:
            this.position = new PIXI.Point(300, 200);
            break;
        case 3:
            this.position = new PIXI.Point(550, 200);
            break;
        case 4:
            this.position = new PIXI.Point(820, 200);
            break;
        case 5:
            this.position = new PIXI.Point(900, 450);
            break;
        case 6:
            this.position = new PIXI.Point(820, 700);
            break;
        case 7:
            this.position = new PIXI.Point(550, 700);
            break;
        case 8:
            this.position = new PIXI.Point(300, 700);
            break;
        case 9:
            this.position = new PIXI.Point(100, 700);
            break;
        case 10:
            this.position = new PIXI.Point(50, 450);
            break;
        default:
            throw "Something is wrong";
    }
};

/**
 * Where the player is sitting
 * 
 * @type {PIXI.Point}
 */
Player.prototype.position = null;

/**
 * Players list
 * 
 * @memberof Player
 * @static
 * @type {Player[]}
 */
Player.players = [];

var toSpan = function (string, klass) {
    return "<span class='" + klass + "'>" + string + '</span>';
};

$(document).ready(
    function () {
        var socket = io.connect('http://localhost:8000');

        socket.on(connect, function (data) {
            console.log("Listened to a connect event");
            socket.emit(iSatDown, {roomID: roomID});
        });

        socket.on(
            playerSatDown,
            function (username) {
                console.log("listened to a playerJoined event");
                console.log(username);
                new Player(username);
            }
        );

        socket.on(
            playersNeedToAnte,
            function (usernames) {
                Player.addArrowsTo(usernames);
            }
        );


        /**
         * Listens for dealerDeltHoleCards; event where we are dealt new hole cards
         *
         * @listens dealerDeltHoleCards
         */
        socket.on(
            dealerDealtHoleCards,
            function (cards) {
                console.log("Listened to a dealerDeltHoleCards event");
                // deal first card
                for (var i = 0; i < Player.players.length; i++) {
                    // var card = new Card(gameState.cards[i]); 
                    var card = new Card(cards.shift()); 
                    stage.addChild(card.sprite);
                    card.sprite.scale = new PIXI.Point(2,2);
                    card.sprite.position = deck.position.clone();
                    cards.push(card);
                    card.animateTo(Player.players[i].position, 800, i * 200);
                }

                // deal second card... slightly over in position
                for (var i = 0; i < Player.players.length; i++) {
                    // var card = new Card(gameState.cards[i]); 
                    var card = new Card(cards.shift()); 
                    var newPosition = Player.players[i].position.clone();
                    newPosition.x += 20;
                    newPosition.y += 20;
                    stage.addChild(card.sprite);
                    card.sprite.scale = new PIXI.Point(2,2);
                    card.sprite.position = deck.position.clone();
                    cards.push(card);
                    card.animateTo(newPosition, 800, (i + Player.players.length) * 200);
                }
            }
        );

        /**
         * Listens for playerBet; event where players bet
         *
         * @listens playerBet
         */
        socket.on(
            playerBet,
            function (playerBet) {
                var player = playerBet.player;
                var bet = playerbet.amount;
                Player.playerBet(player, bet);
                Player.removeArrow(player);

                Player.subtract(player, bet);
            }
        );

        /**
         * @listens playerNeedsToBet
         */
        socket.on(
            playerNeedsToBet,
            function (playerBet) {
                Player.addArrow(player);
            }
        );

        /**
         * Listens for newCommunityCards; event where we are dealt new community cards
         *
         * @listens dealerDealtCommunityCards
         */
        socket.on(
            dealerDealtCommunityCards,
            function (data) {
                console.log("Listened to a dealerDealtCommunityCards event");
                cards.map(function (card) { table.addCommunityCard(card); });
            }
        );

        /**
         * @listens playerWon
         */
        socket.on(
            playerWon,
            function (player) {
                table.handleWinner(player);
            }
        );

        /**
         * @listens dealerResetGame
         */
        socket.on(
            dealerResetGame,
            function () {
                table.reset();
            }
        );

        /**
         * @listens playerLeft
         */
        socket.on(
            playerLeft,
            function (player) {
                Player.removePlayer(player);
            }
        );

        /**
         * @listens youSatDown
         */
        socket.on(
            youSatDown,
            function (players) {
                players.map(function (player) { new Player(player); });
            }
        );

        // consts
        var BLACK = 0x000000;

        // get the canvas obj
        var $canvas = $('canvas');
        // create the root of the interactive scenegraph
        var stage = new PIXI.Stage(BLACK, true);
        stage.addChild(pokerTable);
        stage.addChild(readyButton);
        stage.addChild(checkOrFold);
        stage.addChild(betOrRaise);
        stage.addChild(deck);


        // decide between canvas and webgl for us
        var renderer = PIXI.autoDetectRenderer(
            1680,
            1050,
            $canvas[0]
        );

        deck.scale = new PIXI.Point(3,3);
        deck.position.x = 700;
        deck.position.y = 450;
        readyButton.position.y = 20;
        readyButton.position.x = 20;
        checkOrFold.position.y = 20;
        checkOrFold.position.x = 220;
        betOrRaise.position.y = 20;
        betOrRaise.position.x = 420;
        readyButton.setInteractive(true);
        checkOrFold.setInteractive(true);
        betOrRaise.setInteractive(true);

        /**
         * Ready up
         */
        readyButton.mousedown = function () {
            console.log("Firing ready event");
            socket.emit(
                iBet,
                {
                    player: mePlayer,
                    amount: table.ante
                }
            );
        };

        /**
         * Let the server know we are placing a bet
         *
         * @fires bet
         */
        betOrRaise.mousedown = function () {
            console.log("Firing bet event");
            socket.emit(
                bet,
                {
                    amount: parseInt(prompt("How much do you want to bet?")),
                    // not used on this end... TODO refactor and use a separate object
                    nextPlayer: null
                }
            );
        };

        /**
         * Tell the server we are betting 0
         *
         * @fires bet
         */
        checkOrFold.mousedown = function (mouseData) {
            console.log("Firing bet event");
            socket.emit(
                bet,
                {
                    amount: 0,
                    // not used on this end... TODO refactor and use a separate object
                    nextPlayer: null
                }
            );
        };

        var update = function () {

            // Run the function within the animations array, and then remove it
            var animlength = animations.length;
            for (var i = 0; i < animlength; i++) {
                var animation = animations.shift();
                var func = animation[0];
                var obj = animation[1];
                var args = animation[2];
                func.apply(obj, args);
            }

            renderer.render(stage);
            requestAnimFrame(update);
        };
        requestAnimFrame(update);
    }
);
