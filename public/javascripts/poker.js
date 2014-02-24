var BLACK = '#000000';
var WIDTH = 640;
var HEIGHT = 480;
var TABLE_IMAGE_NAME = 'table';
var TABLE_IMAGE_LOCATION = '/vendor/imgs/poker_table.png';
var READY_BUTTON_X;
var READY_BUTTON_Y;
var READY_BUTTON_IMAGE_NAME;
var CHECK_BUTTON_X;
var CHECK_BUTTON_Y;
var CHECK_BUTTON_IMAGE_NAME;
var BET_BUTTON_X;
var BET_BUTTON_Y;
var BET_BUTTON_IMAGE_NAME;
var FOLD_BUTTON_X;
var FOLD_BUTTON_Y;
var FOLD_BUTTON_IMAGE_NAME;
var RAISE_BUTTON_X;
var RAISE_BUTTON_Y;
var RAISE_BUTTON_IMAGE_NAME;

/**
 * State object for our game
 *
 * @class
 * @extends Phaser.State
 */
var GameState = function () {
};
GameState.prototype = new Phaser.State();

/**
 * Socket IO object to the server
 *
 * @memberof! GameState
 * @type {io.Client}
 */
GameState.prototype.socket = null;

/**
 * Table object to represent the game
 *
 * @memberof! GameState
 * @type {Table}
 */
GameState.prototype.table = null;

/**
 * Button to run an event that the player is ready
 *
 * @memberof! GameState
 * @type {Phaser.Button}
 */
GameState.prototype.readyButton = null;

/**
 * Button to run an event that the player wants to check
 *
 * @memberof! GameState
 * @type {Phaser.Button}
 */
GameState.prototype.checkButton = null;

/**
 * Button to run an event that the player wants to bet
 *
 * @memberof! GameState
 * @type {Phaser.Button}
 */
GameState.prototype.betButton = null;

/**
 * Button to run an event that the player wants to call
 *
 * @memberof! GameState
 * @type {Phaser.Button}
 */
GameState.prototype.callButton = null;

/**
 * Button to run an event that the player wants to fold
 *
 * @memberof! GameState
 * @type {Phaser.Button}
 */
GameState.prototype.foldButton = null;

/**
 * Button to run an event that the player wants to raise
 *
 * @memberof! GameState
 * @type {Phaser.Button}
 */
GameState.prototype.raiseButton = null;

/**
 * Button to run an event that the player is ready
 *
 * @memberof! GameState
 * @type {Phaser.Button}
 */

/**
 * Group containing all buttons
 *
 * @memberof! GameState
 * @type {Phaser.Group}
 */
GameState.prototype.buttonGroup = null;

/**
 * Starts loading assets
 *
 * @memberof GameState
 * @method
 */
GameState.prototype.preload = function () {
    this.game.stage.backgroundColor = BLACK;
    this.game.load.image(TABLE_IMAGE_NAME, TABLE_IMAGE_LOCATION);
};

/**
 * To be run after assets loaded
 *
 * @memberof GameState
 * @method
 * @override
 */
GameState.prototype.create = function () {
    // connect to the server
    this.socket = io.connect('http://' + document.domain + ':' + location.port);
    // and add the callbacks
    this.addHandlers();
    // create our table object
    this.table = new Table(this.game.add.sprite(WIDTH, HEIGHT, TABLE_IMAGE_NAME), this.game);
    // create our buttons
    this.createButtons();
    // and hide them
    this.hideButtons();
};

/**
 * Creates all the buttons we will use
 *
 * @memberof GameState
 * @method
 */
GameState.prototype.createButtons = function () {
    // create the handles to the buttons locally
    this.readyButton = new Phaser.Button(this.game, READY_BUTTON_X, READY_BUTTON_Y, READY_BUTTON_IMAGE_NAME, this.clickedReady, this);
    this.checkButton = new Phaser.Button(this.game, CHECK_BUTTON_X, CHECK_BUTTON_Y, CHECK_BUTTON_IMAGE_NAME, this.clickedCheck, this);
    this.betButton = new Phaser.Button(this.game, BET_BUTTON_X, BET_BUTTON_Y, BET_BUTTON_IMAGE_NAME, this.clickedBet, this);
    this.callButton = new Phaser.Button(this.game, CHECK_BUTTON_X, CHECK_BUTTON_Y, CHECK_BUTTON_IMAGE_NAME, this.clickedCall, this);
    this.foldButton = new Phaser.Button(this.game, FOLD_BUTTON_X, FOLD_BUTTON_Y, FOLD_BUTTON_IMAGE_NAME, this.clickedFold, this);
    this.raiseButton = new Phaser.Button(this.game, RAISE_BUTTON_X, RAISE_BUTTON_Y, READY_BUTTON_IMAGE_NAME, this.clickedRaise, this);

    // and create a group to hold them in
    this.buttonGroup = new Phaser.Group(this.game);
    this.buttonGroup.add(this.readyButton);
    this.buttonGroup.add(this.checkButton);
    this.buttonGroup.add(this.betButton);
    this.buttonGroup.add(this.callButton);
    this.buttonGroup.add(this.foldButton);
    this.buttonGroup.add(this.raiseButton);
};

/**
 * Hides all buttons we have
 *
 * @memberof GameState
 * @method
 */
GameState.prototype.hideButtons = function () {
    this.buttonGroup.setAll('visible', false);
    this.buttonGroup.setAll('exists', false);
    this.buttonGroup.setAll('alive', false);
};

/**
 * Hides one particular button
 *
 * @memberof GameState
 * @method
 * @param {Phaser.Button} button to hide
 */
GameState.prototype.hideButton = function (button) {
    button.visible = false;
    button.exists = false;
    button.alive = false;
};

/**
 * Shows one particular button
 *
 * @memberof GameState
 * @method
 * @param {Phaser.Button} button to show
 */
GameState.prototype.showButton = function (button) {
    button.visible = true;
    button.exists = true;
    button.alive = true;
};

/**
 * Adds ALL of the this.socket handles
 *
 * @memberof GameState
 * @method
 */
GameState.prototype.addHandlers = function () {
    var gameState = this;

    // add handles for socketio
    this.socket.on(
        connect,
        function () {
            console.log("Listened to a connect event");
            console.log("Firing an iSatDown event");
            gameState.socket.emit(iSatDown, {roomID: roomID});
            gameState.welcomeUser();
        }
    );

    /**
     * @listens youSatDown
     */
    this.socket.on(
        youSatDown,
        function (playersAnteObj) {
            console.log("Listened to a youSatDown event");
            gameState.handleJustSittingDownByPlayersAnteObj(playersAnteObj);
            
        }
    );

    this.socket.on(
        playerSatDown,
        function (player_obj) {
            console.log("listened to a playerJoined event");
            gameState.table.addPlayerByPlayerObj(player_obj);
            gameState.toastLatestPlayer();
        }
    );

    this.socket.on(
        playersNeedToAnte,
        function (players) {
            console.log("listened to a playerNeedsToAnte event");
            gameState.alertPlayersNeedToAnteByPlayerObjs(players);
        }
    );

    this.socket.on(
        dealerDealtHoleCards,
        function (cards) {
            console.log("Listened to a dealerDeltHoleCards event");
            gameState.dealHoleCardByCardObjs(cards);
        }
    );

    /**
     * Listens for playerBet; event where players bet
     *
     * @listens playerBet
     */
    this.socket.on(
        playerBet,
        function (playerBet) {
            console.log("Listened to a playerBet event");
            gameState.handleBetForPlayerByPlayerBetObj(playerBet);
        }
    );

    /**
     * @listens playerNeedsToBet
     */
    this.socket.on(
        playerNeedsToBet,
        function (playerBet) {
            console.log("Listened to a playerNeedsToBet event");
            gameState.alertPlayersNeedToBetByPlayerBetObj(playerBet);
        }
    );

    /**
     * Listens for newCommunityCards; event where we are dealt new community cards
     *
     * @listens dealerDealtCommunityCards
     */
    this.socket.on(
        dealerDealtCommunityCards,
        function (cards) {
            console.log("Listened to a dealerDealtCommunityCards event");
            gameState.dealCommunityCardsByCardObjs(cards);
        }
    );

    /**
     * @listens playerWon
     */
    this.socket.on(
        playerWon,
        function (player) {
            gameState.handlePlayerWinByPlayerObj(player);
        }
    );

    /**
     * @listens dealerResetGame
     */
    this.socket.on(
        dealerResetGame,
        function () {
            console.log("Listened to a dealerResetGame event");
            gameState.resetGame();
        }
    );

    /**
     * @listens playerLeft
     */
    this.socket.on(
        playerLeft,
        function (player) {
            console.log("Listened to a playerLeft event");
            gameState.handlePlayerLeftByPlayerObj(player);
        }
    );
};

/**
 * Toast our user with information
 *
 * @memberof GameState
 * @method
 * @param {message}
 */
GameState.prototype.toast = toastr.info;

/**
 * Welcomes the user to the game, and performs new-user actions
 *
 * @memberof GameState
 * @method
 */
GameState.prototype.welcomeUser = function () {
    this.toast("Welcome!");
    this.showButton(this.readyButton);
};

/**
 * Handle the message we get when a player sits down
 *
 * @memberof GameState
 * @method
 * @param {PlayersAnteObj} playersAnteObj - object containing beginning information
 */
GameState.prototype.handleJustSittingDownByPlayersAnteObj = function (playersAnteObj) {
    var ante = playersAnteObj.ante;
    var players = playersAnteObj.players;
    this.table.setAnte(ante);
    this.table.addPlayersFromSocketIO(players);
};

/**
 * Add one particular player to the game
 *
 * @memberof GameState
 * @method
 * @param {eventPlayer} playerObj to add
 */
GameState.prototype.addPlayerByPlayerObj = function (playerObj) {
    this.table.addPlayerFromSocketIO(playerObj);
};

/**
 * Let our user know that a new player has joined
 *
 * @memberof GameState
 * @method
 */
GameState.prototype.toastLatestPlayer = function () {
    this.toast(this.table.getLastPlayer().getUsername() + " has joined");
};

/**
 * Alert that all these players need to ante!
 *
 * @memberof GameState
 * @method
 * @param {eventPlayer[]} playerObjs to alert
 */
GameState.prototype.alertPlayersNeedToAnteByPlayerObjs = function (playerObjs) {
    this.table.clearAlerts();
    this.table.alertPlayersByPlayerObj(playerObjs);
};

/**
 * Deal the hole cards
 *
 * @memberof GameState
 * @method
 * @param {eventCard[]} cardObjs
 */
GameState.prototype.dealHoleCardByCardObjs = function (cardObjs) {
    this.hideButton(this.readyButton);
    this.table.dealHoleCardsByCardObjs(cardObjs);
};

/**
 * Alert our user that a bet has taken place
 *
 * @memberof GameState
 * @method
 * @param {eventPlayerBet} playerBet
 */
GameState.prototype.handleBetForPlayerByPlayerBetObj = function (playerBet) {
    this.table.clearAlerts();
    this.table.doBetForPlayerByPlayerBetObj(playerBet);
};

/**
 * Alert our user that some player needs to bet
 *
 * @memberof GameState
 * @method
 * @param {eventPlayerBet} playerBet
 */
GameState.prototype.alertPlayersNeedToBetByPlayerBetObj = function (playerBet) {
    var player = playerBet.player;
    var amount = playerBet.amount;

    this.table.alertPlayerByPlayerObj(player);

    // if we are this player...
    if (this.table.isThisPlayerByPlayerObj(player)) {
        if (amount > 0) {
            this.showButton(this.callButton);
            this.showButton(this.foldButton);
            this.showButton(this.raiseButton);
        } else {
            this.showButton(this.checkButton);
            this.showButton(this.betButton);
        }
    }
};

/**
 * Deal new cards for the table
 *
 * @memberof GameState
 * @method
 * @param {eventCard[]} cardsObjs
 */
GameState.prototype.dealCommunityCardsByCardObjs = function (cardsObjs) {
    this.table.dealCommunityCardsByCardObjs(cardsObjs);
};

/**
 * Alert our user that a player has won the game
 *
 * @memberof GameState
 * @method
 * @param {eventPlayer} winner
 */
GameState.prototype.handlePlayerWinByPlayerObj = function(winner) {
    var player = this.table.getPlayerByPlayerObj(winner);
    this.toast(player.getUsername() + " has won");
};

/**
 * Resets game state
 *
 * @memberof GameState
 * @method
 */
GameState.prototype.resetGame = function () {
    this.table.reset();
};

/**
 * Handle when a player leaves the game
 *
 * @memberof GameState
 * @method
 */
GameState.prototype.handlePlayerLeftByPlayerObj = function (playerObj) {
    var player = this.table.getPlayerByPlayerObj(winner);
    this.table.removePlayer(player);
    this.toast(player.getUsername() + " has left the game");
};

/**
 * Table of a game
 *
 * @class
 * @param {Phaser.Sprite} sprite - visual element of the game
 * @param {Phaser.Game} game - Phaser game object we can use for grouping
 */
var Table = function (sprite, game) {
    this.sprite = sprite;
    this.ante = 0;
    this.players = new Phaser.Group(game);
};

/**
 * Visual element
 *
 * @memberof! Table
 * @type {Phaser.Sprite}
 */
Table.prototype.sprite = null;

/**
 * Bet to ready-up in the game
 *
 * @memberof! Table
 * @type {Number}
 */
Table.prototype.ante = 0;

/**
 * Players at the table
 *
 * @memberof! Table
 * @type {PlayerManager}
 */
Table.prototype.players = null;

/**
 * Sets the ante for our table
 *
 * @memberof Table
 * @method
 * @param {Number} ante
 */
Table.prototype.setAnte = function (ante) {
    this.ante = ante;
};

/**
 * Add a player to our table via a socket IO object
 *
 * @memberof Table
 * @method
 * @param {eventPlayer[]} players
 */
Table.prototype.addPlayersFromSocketIO = function (players) {
    var table = this;
    players.forEach(
        function (playerObj) {
            var player = PlayerFactory.fromSocketIOPlayer(playerObj);
            this.addPlayer(player);
        }
    );
};

/**
 * Add one player
 *
 * @memberof Table
 * @method
 * @param {Player}
 */
Table.prototype.addPlayer = function (player) {
    this.players.add(player);
};

$(document).ready(
    function () {
        var game = new Phaser.Game(WIDTH, HEIGHT, Phaser.AUTO, $('canvas')[0], new GameState());
    }
);

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
var toSpan = function (string, klass) {
    return "<span class='" + klass + "'>" + string + '</span>';
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
