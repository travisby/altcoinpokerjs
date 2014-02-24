///<reference path='../vendor/definitions/phaser.d.ts' />
///<reference path='../vendor/definitions/jquery.d.ts' />
///<reference path='../vendor/definitions/socket.io.d.ts' />
declare var roomID : number
declare var toastr

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

class GameState extends Phaser.State {
    private socket : Socket;
    private table : Table;
    private readyButton : Phaser.Button;
    private checkButton : Phaser.Button;
    private betButton : Phaser.Button;
    private callButton : Phaser.Button;
    private foldButton : Phaser.Button;
    private raiseButton : Phaser.Button;
    private buttonGroup : Phaser.Group;


    constructor() {
        super();
    }

    preload() {
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
    }

    create() {
    }

    createButtons() {
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
    }

    hideButtons() {
        this.buttonGroup.setAll('visible', false);
        this.buttonGroup.setAll('exists', false);
        this.buttonGroup.setAll('alive', false);
    }

    hideButton(button : Phaser.Button) {
        button.visible = false;
        button.exists = false;
        button.alive = false;
    }

    showButton(button : Phaser.Button) {
        button.visible = true;
        button.exists = true;
        button.alive = true;
    }

    addHandlers() {
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
    }

    toast(message : string) {
        return toastr.info(message);
    }

    welcomeUser() {
        this.toast("Welcome!");
        this.showButton(this.readyButton);
    }

    handleJustSittingDownByPlayersAnteObj(playersAnteObj : PlayersAnteObj) {
        var ante = playersAnteObj.ante;
        var players = playersAnteObj.players;
        this.table.setAnte(ante);
        this.table.addPlayersFromSocketIO(players);
    }

    addPlayerByPlayerObj(playerObj : EventPlayer) {
        this.table.addPlayerFromSocketIO(playerObj);
    }

    toastLatestPlayer() {
        this.toast(this.table.getLastPlayer().getUsername() + " has joined");
    }

    alertPlayersNeedToAnteByPlayerObjs(playerObjs : EventPlayer[]) {
        this.table.clearAlerts();
        this.table.alertPlayersByPlayerObj(playerObjs);
    }

    dealHoleCardByCardObjs(cardObjs : string[]) {
        this.hideButton(this.readyButton);
        this.table.dealHoleCardsByCardObjs(cardObjs);
    }

    handleBetForPlayerByPlayerBetObj(playerBet : EventBet) {
        this.table.clearAlerts();
        this.table.doBetForPlayerByPlayerBetObj(playerBet);
    }

    alertPlayersNeedToBetByPlayerBetObj(playerBet : EventBet) {
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
    }

    dealCommunityCardsByCardObjs(cardsObjs : string[])  {
        this.table.dealCommunityCardsByCardObjs(cardsObjs);
    }

    handlePlayerWinByPlayerObj(winner : EventPlayer) {
        var player = this.table.getPlayerByPlayerObj(winner);
        this.toast(player.getUsername() + " has won");
    }

    resetGame() {
        this.table.reset();
    }
    
    handlePlayerLeftByPlayerObj(playerObj : EventPlayer) {
        var player = this.table.getPlayerByPlayerObj(playerObj);
        this.table.removePlayer(player);
        this.toast(player.getUsername() + " has left the game");
    }

    clickedReady() {
        // TODO
    }

    clickedCheck() {
        // TODO
    }

    clickedBet() {
        // TODO
    }

    clickedCall() {
        // TODO
    }

    clickedFold() {
        // TODO
    }

    clickedRaise() {
        // TODO
    }
}

class Table {
    private sprite : Phaser.Sprite;
    private ante : number;
    private players : PlayerManager;
    constructor(sprite : Phaser.Sprite, game : Phaser.Game) {
        this.sprite = sprite;
        this.ante = 0;
        this.players = new PlayerManager();
    }

    setAnte(amount : number) {
        this.ante = amount;
    }

    addPlayersFromSocketIO(players : EventPlayer[]) {
        var table = this;
        players.forEach(
            function (playerObj) {
                var player = PlayerFactory.fromSocketIOPlayer(playerObj);
                table.addPlayer(player);
            }
        );
    }

    addPlayer(player : Player) {
        // TODO
    }

    addPlayerByPlayerObj(player : EventPlayer) {
        // TODO
    }

    addPlayerFromSocketIO(playerObj : EventPlayer) {
        // TODO
    }

    getLastPlayer() : Player {
        // TODO
        return null;
    }

    clearAlerts() {
        // TODO
    }

    alertPlayersByPlayerObj(playerObjs : EventPlayer[]) {
        // TODO
    }

    dealHoleCardsByCardObjs(cardObjs : string[]) {
        // TODO
    }

    doBetForPlayerByPlayerBetObj(playerBet : EventBet) {
        // TODO
    }

    alertPlayerByPlayerObj(player : EventPlayer) {
        // TODO
    }

    isThisPlayerByPlayerObj(player : EventPlayer) : boolean {
        // TODO
        return false;
    }

    dealCommunityCardsByCardObjs(cardsObjs : string[]) {
        // TODO
    }

    getPlayerByPlayerObj(player : EventPlayer) : Player {
        // TODO
        return null;
    }

    reset() {
        // TODO
    }

    removePlayer(player : Player) {
        // TODO
    }
}

class PlayerManager {
    // TODO
}

class PlayerFactory {
    public static fromSocketIOPlayer(playerObj) : Player {
        // TODO
        return new Player()
    }
}

class Player {
    // TODO

    getUsername() : string {
        // TODO
        return '';
    }
}

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


interface EventPlayer {
    username: string;
}

interface EventBet {
    amount : number;
    player : EventPlayer; 
}

interface PlayersAnteObj {
    ante: number;
    players : EventPlayer[];
}


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
