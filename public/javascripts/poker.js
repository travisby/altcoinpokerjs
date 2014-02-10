/**
 * Betting Object Type Decleration
 *
 * @typedef {Object} betObj
 * @property {number} amount - number of coins to bet
 * @property {Player} nextPlayer - the player that bet
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
 * @event joiningPlayer
 * @type {String} - the player name
 */
var joinedPlayer = 'joinedPlayer';

/**
 * Event for users joining a room
 *
 * @event join
 * @type {number} -  the room ID to join
 */
var join = 'join';

/**
 * Event for sending hole cards to players
 *
 * @event newPlayerCards
 * @type {object}
 * @property {string} cards - ',' delimited list of cards
 */
var newPlayerCards = 'newPlayerCards';

/**
 * Event for sending community cards
 *
 * @event newCommunityCards
 * @type {object}
 * @property {string} cards - ',' delimited list of cards
 */
var newCommunityCards = 'newCommunityCards';

/**
 * Event to broadcast that the hand has been dealt
 *
 * @event deal
 */
var deal = 'deal';

/**
 * Event to be sent to inform everyone of a bet
 *
 * @event bet
 * @type {betObj}
 */
var bet = 'bet';

/**
 * Event to tell the server that a specific user is ready
 *
 * @event ready
 */
var ready = 'ready';

/**
 * Event when a user leaves the game, whether accidentally or purposely
 *
 * @event disconnect
 */
var disconnect = 'disconnect';

var socket = io.connect('http://localhost:8000');

socket.on('connect', function (data) {
    console.log("Listened to a connect event");
    socket.emit('join', {roomID: roomID});
});

socket.on(
    joinedPlayer,
    function (username) {
        console.log("listened to a playerJoined event");
        console.log(username);
        // TODO draw player
    }
);

/**
 * Listens for newPlayerCards; event where we are dealt new hole cards
 *
 * @listens newPlayerCards
 */
socket.on(
    newPlayerCards,
    function (data) {
        console.log("Listened to a newPlayerCards event");
        console.log(JSON.stringify(data.cards));
        // TODO display them on the game screen
        // for now we just print them into the console
        $('#holeCardsList')[0].innerHTML = (data.cards.map(function (cardString) { return toSpan(stringToCardCharacter(cardString));}));
    }
);

/**
 * Listens for newCommunityCards; event where we are dealt new community cards
 *
 * @listens newCommunityCards
 */
socket.on(
    newCommunityCards,
    function (data) {
        console.log("Listened to a newCommunityCardsCards event");
        console.log(JSON.stringify(data.cards));
        // TODO display them on the game screen
        // for now we just print them into the console
        $('#communityCardsList')[0].innerHTML = (data.cards.map(function (cardString) { return toSpan(stringToCardCharacter(cardString));}));
    }
);

/**
 * Listens for deal, letting us know cards are being dealt
 *
 * We should draw to the screen
 *
 * @listens deal
 */
socket.on(
    deal,
    function () {
        console.log("Listened to a deal event");
        // TODO draw cards being dealt
    }
);

/**
 * Let the server know we are placing a bet
 *
 * @fires bet
 */
$('#betButton')[0].onclick = function () {
    console.log("Firing bet event");
    socket.emit(
        bet,
        {
            amount: parseInt($('#betAmountField')[0].value),
            // not used on this end... TODO refactor and use a separate object
            nextPlayer: null
        }
    );
};

/**
 * Player readys-up
 *
 * @fires ready
 */
$('#readyButton')[0].onclick = function () {
    console.log("Firing ready event");
    socket.emit(ready);
};

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

$(document).ready(
    function () {
        // consts
        var BLACK = 0x000000;

        // get the canvas obj
        var $canvas = $('canvas');
        // create the root of the scenegraph
        var stage = new PIXI.Stage(BLACK);

        // decide between canvas and webgl for us
        var renderer = PIXI.autoDetectRenderer(
            1680,
            1050,
            $canvas[0]
        );

        var pokerTable = PIXI.Sprite.fromImage('/vendor/imgs/poker_table.png');
        stage.addChild(pokerTable);
        var update = function () {
            renderer.render(stage);
            requestAnimFrame(update);
        };
        requestAnimFrame(update);
    }
);
