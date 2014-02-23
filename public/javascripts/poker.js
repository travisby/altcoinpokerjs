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

// consts
var BLACK = 0x000000;
var stage = new PIXI.Stage(BLACK);

// objects used elsewhere
var animations = [];

var Table = function () {
    this.sprite.addChild(this.deck);
    this.sprite.addChild(this.readyButton);
    this.sprite.addChild(this.checkOrFoldButton);
    this.sprite.addChild(this.betOrRaiseButton);
    this.deck.scale = new PIXI.Point(2,2);
    this.deck.position.x = 550;
    this.deck.position.y = 213;
    this.readyButton.position.y = 20;
    this.readyButton.position.x = 20;
    this.checkOrFoldButton.position.y = 20;
    this.checkOrFoldButton.position.x = 220;
    this.betOrRaiseButton.position.y = 20;
    this.betOrRaiseButton.position.x = 420;
    this.readyButton.setInteractive(true);
    this.checkOrFoldButton.setInteractive(true);
    this.betOrRaiseButton.setInteractive(true);
    this.cards = [];

};

/**
 * Players array
 * @type {Player[]}
 */
Table.prototype.players = [];

Table.prototype.cards = [];

/**
 * Sprite backed item for our table
 *
 * @type {PIXI.Sprite}
 */
Table.prototype.sprite = PIXI.Sprite.fromImage('/vendor/imgs/poker_table.png');

/**
 * Deck
 *
 * @type {PIXI.Sprite}
 */
Table.prototype.deck = new PIXI.Text($('<div />').html(stringToCardCharacter('')).text(), {fill: 'white'}); 

/**
 * Ready / Ante / Blind button
 *
 * @type {PIXI.Sprite}
 */
Table.prototype.readyButton = new PIXI.Text(
    'Ready',
    {
        fill: 'white'
    }
);

/**
 * Ready / Ante / Blind button
 *
 * @type {PIXI.Sprite}
 */
Table.prototype.checkOrFoldButton = new PIXI.Text(
    'Check',
    {
        fill: 'white'
    }
);

/**
 * Bet or Raise
 *
 * @type {PIXI.Sprite}
 */
Table.prototype.betOrRaiseButton = new PIXI.Text(
    'Bet',
    {
        fill: 'white'
    }
);


/**
 * Add Player
 * @param {Player} player
 */
Table.prototype.addPlayer = function (player) {
    this.players.push(player);
    this.sprite.addChild(player.sprite);
};

/**
 * How should we do our animation?
 *
 * @propertyof! Table
 * @static
 * @type [PIXI.Point,Number][]
 */
Table.animationsOnIndex = [
    [new PIXI.Point(200, 470), 0],
    [new PIXI.Point(260, 470), 40],
    [new PIXI.Point(320, 470), 40],
    [new PIXI.Point(380, 470), 0],
    [new PIXI.Point(440, 470), 0],
];

Table.prototype.addNewCommunityCard = function (card) {
    this.cards.push(card);
    this.sprite.addChild(card.sprite);
    card.sprite.scale = new PIXI.Point(2,2);
    card.sprite.position = this.deck.position.clone();

    var point = Table.animationsOnIndex[this.cards.length -1][0];
    var deferFrames = Table.animationsOnIndex[this.cards.length -1][1];
    var time = 80;  // TODO come up with a better way?
    card.animateTo(point, time, deferFrames);
};

/**
 * Do visuals for winner
 * 
 * @method
 * @param {String} player that won
 */
Table.prototype.handleWinner = function (player) {
    // TODO visually show who wins
    // and add money to their account
    // visually show taking chips?
    alert("Winner: " + player);
};

/**
 * Reset the game visually
 *
 * @method
 */
Table.prototype.reset = function () {
    // TODO remove all cards from the table
    // and chips from bets
};


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
 * @event connect
 */
var connect = 'connect';

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
    this.sprite = new PIXI.Text($('<div />').html(stringToCardCharacter(str)).text(), {fill: 'white'});
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
    var sprite = this.sprite;
    amount.x = (point.x - sprite.position.x) / frames;
    amount.y = (point.y - sprite.position.y) / frames;

    var animateFunction = function (amount, times, startIn) {
        // defer
        if (startIn > 0) {
            animations.push([animateFunction, this, [amount, times, startIn - 1]]);
            return;
        }

        // we're done
        if (times < 0) {
            return;
        }
        this.position.x += amount.x;
        this.position.y += amount.y;
        animations.push([animateFunction, this, [amount, times - 1, 0]]);
    };
    animations.push([animateFunction, sprite, [amount, frames, startIn]]);
};

/**
 * Player
 *
 * @constructor
 * @param {UserObj} userObj
 */
var Player = function (userObj) {
    var username = userObj;
    Player.players.push(this);
    this.cards = [];


    // Decide their place on the webgl board
    switch (Player.players.length) {
        case 1:
            this.position = new PIXI.Point(100, 200);
            break;
        case 2:
            this.position = new PIXI.Point(250, 150);
            break;
        case 3:
            this.position = new PIXI.Point(425, 150);
            break;
        case 4:
            this.position = new PIXI.Point(550, 150);
            break;
        case 5:
            this.position = new PIXI.Point(700, 200);
            break;
        case 6:
            this.position = new PIXI.Point(700, 350);
            break;
        case 7:
            this.position = new PIXI.Point(550, 400);
            break;
        case 8:
            this.position = new PIXI.Point(425, 400);
            break;
        case 9:
            this.position = new PIXI.Point(250, 400);
            break;
        case 10:
            this.position = new PIXI.Point(100, 400);
            break;
        default:
            throw "Something is wrong";
    }

    this.sprite = new PIXI.Graphics();
    this.sprite.beginFill(0x000000);
    this.sprite.drawCircle(0, 0, 50);
    this.sprite.endFill();
    this.sprite.updateBounds();
    this.sprite.addChild(new PIXI.Text(username, { fill: 'white'}));
    this.sprite.position = this.position.clone();
};

/**
 * Our sprite
 */
Player.prototype.sprite = null;

/**
 * Where the player is sitting
 * 
 * @type {PIXI.Point}
 */
Player.prototype.position = null;

/**
 */
Player.prototype.cards = [];

/**
 * Add hole cards to this player
 */
Player.prototype.addHoleCard = function (card, defer) {
    this.cards.push(card);
    this.sprite.addChild(card.sprite);
    card.animateTo(this.position.clone(), 40, defer);
};

/**
 * Players list
 * 
 * @memberof Player
 * @static
 * @type {Player[]}
 */
Player.players = [];

/**
 * Visually removes chips from a player, and brings their counter down
 *
 * @propertyof Player
 * @static
 * @method
 * @param {Player} player that bet
 * @param {Number} amount the player bet
 */
Player.playerBet = function (player, amount) {
    // TODO visual to show player throwing chips in, and bringing their counter down
};

/**
 * Remove the visual arrow from player
 *
 * @propertyof Player}
 * @static
 * @method
 * @param {Player} player to remove arrow from
 */
Player.removeArrow = function (player) {
    // TODO visually remove the arrow tracking the player
};

/**
 * Add the visual arrow to player
 *
 * @propertyof Player}
 * @static
 * @method
 * @param {Player} player to add arrow to
 */
Player.addArrow = function (player) {
    // TODO visually add an arrow tracking the player
};

var toSpan = function (string, klass) {
    return "<span class='" + klass + "'>" + string + '</span>';
};

$(document).ready(
    function () {
        var socket = io.connect('http://' + document.domain + ':' + location.port);
        var table = new Table();

        socket.on(connect, function (data) {
            console.log("Listened to a connect event");
            socket.emit(iSatDown, {roomID: roomID});
        });

        socket.on(
            youSatDown,
            function (players) {
                for (var i = 0; i < players.length; i++) {
                    table.addPlayer(new Player(players[i]));
                }
            }
        );

        socket.on(
            playerSatDown,
            function (username) {
                console.log("listened to a playerJoined event");
                console.log(username);
                table.addPlayer(new Player(username));
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
                console.log(cards);
                console.log(table.players);
                // deal first card
                for (var i = 0; i < cards.length; i++) {
                    // var card = new Card(gameState.cards[i]); 
                    var player = table.players[i % table.players.length];
                    var card = new Card(cards[i]); 
                    card.sprite.scale = table.deck.scale.clone();
                    card.sprite.position = table.deck.position.clone();
                    player.addHoleCard(card, i * 20);
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
                var bet = playerBet.amount;
                Player.playerBet(player, bet);
                Player.removeArrow(player);
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
            function (cards) {
                console.log("Listened to a dealerDealtCommunityCards event");
                console.log(cards);
                cards.map(function (card) { table.addNewCommunityCard(new Card(card)); });
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
            function (playersAnteObj) {
                console.log("Listened to a youSatDown event");
                var players = playersAnteObj.players;
                var ante = playersAnteObj.ante;
                players.map(function (player) { table.addPlayer(new Player(player)); });
                table.ante = ante;
            }
        );


        // get the canvas obj
        var $canvas = $('canvas');
        // create the root of the interactive scenegraph
        stage.addChild(table.sprite);


        // decide between canvas and webgl for us
        var renderer = PIXI.autoDetectRenderer(
            1680,
            1050,
            $canvas[0]
        );

        /**
         * Ready up
         */
        table.readyButton.mousedown = function () {
            console.log("Firing ready event");
            socket.emit(
                iBet, table.ante
            );
        };

        /**
         * Let the server know we are placing a bet
         *
         * @fires bet
         */
        table.betOrRaiseButton.mousedown = function () {
            console.log("Firing bet event");
            socket.emit(iBet, parseInt(prompt("How much do you want to bet?")));
        };

        /**
         * Tell the server we are betting 0
         *
         * @fires bet
         */
        table.checkOrFoldButton.mousedown = function (mouseData) {
            console.log("Firing bet event");
            socket.emit(iBet, 0);
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
