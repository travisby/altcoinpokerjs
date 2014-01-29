// loaded modules
var utils = require('./utils.js');
var db = require('./models/');
var PokerEvaluator = require('poker-evaluator');

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
 * Event to broadcast that the hand has been dealt
 *
 * @event deal
 */
var deal = 'deal';

/**
 * Event to be sent to inform everyone of a bet
 *
 * @event bet
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

/**
 * Max number of players that can sit down at a table.  Others will be watchers
 *
 * @const {number}
 */
var MAX_PLAYERS = 10

/**
 * The longest time we can possibly wait for a player to reconnect
 *
 * @const {number}
 */
var RECONNET_TIMEOUT_MS = 30 * 1000;

// Globals

/**
 * Hashmap holding all of the rooms currently active
 *
 * @type {Object.<number, Table>}
 */
var rooms = {};

/**
 * Adds a bunch of events to the socketio object
 *
 * @param {SocketIO} socketio
 */
var game = function(socketio) {
    /**
     * Event for users connecting to the socketio socket
     *
     * @listens connection
     */
    socketio.on(
        connection,
        /**
         * Callback for when a user connects
         *
         * @fires newPlayerCards
         * @fires deal
         * @fires bet
         *
         * @param {SocketIO} userSocket -- connected user socket
         */
        function (userSocket) {

            /**
             * The currently connected user as a player
             * @type {Player}
             */
            var player = new Player(userSocket);
            // user-specific handlers

            /**
             * Event for when a user joins a specific room
             *
             * @listens join
             */
            userSocket.on(
                join,

                /**
                 * Callback for a user joining a specific room
                 *
                 * @fires deal
                 * @fires bet
                 * @param {number} roomID the id of the room we are joining
                 */
                function (roomID) {
                    // get the Room object first...
                    db.Room.find(roomID).success(
                        /**
                         * Function to run when we get our room object back
                         * 
                         * @param {db.Room} room - room with roomID
                         */
                        function (room) {
                            /**
                             * The current table
                             *
                             * @type {Table}
                             */
                            var table = null;
                            console.log(room);
                            userSocket.join(room);

                            // if we haven't instantiated anything yet...
                            if (!(room.id in rooms)) {
                                rooms[room.id] = new Table(room.deck);
                            }
                            table = rooms[room.id];

                            // add our user if we are not full to the table
                            if (table.players.length < MAX_PLAYERS) {
                                table.players.append(player);
                            }

                            // Now that we have the room...

                            /**
                             * Event for when a player readys-up
                             *
                             * @listens ready
                             */
                            userSocket.on(
                                ready,

                                /**
                                 * Function to be run when a player readys up
                                 *
                                 * @fires newPlayerCards
                                 */
                                function () {

                                    // only ready if the game is ready-able
                                    if (!table.isGameBeingPlayed) {
                                        player.isReady = true;
                                    }

                                    if (table.isCanWeStart()) {
                                        table.dealToPlayers();
                                        table.players.forEach(

                                            /**
                                             * For every player, let them know their cards
                                             *
                                             * @fires newPlayerCards
                                             */
                                            function (player) {
                                                userSocket.emit(
                                                    newPlayerCards,
                                                    {
                                                        cards: JSON.stringify(player.hand.toJSON())
                                                    }
                                                );
                                            }
                                        );
                                        // tell the entire room cards have been dealt
                                        socketio.in(room.id).emit('deal');
                                    }
                                }
                            );

                            /**
                             * Event listener for players betting
                             * @listens bet
                             */
                            userSocket.on(
                                bet,

                                /**
                                 * Function to run when we get our bet
                                 *
                                 * @param {betObj} data
                                 * @fires bet
                                 */
                                function (data) {
                                    if (table.canBet(player)) {
                                        table.bet(player, data['amount']);
                                        data['nextPlayer'] = table.getNextBetter()
                                        socketio.in(roomID).emit('bet', data);
                                    }

                                    // if there are no bets to be made, continue on with the game
                                    if (table.isCanContinueHand()) {
                                        table.continue();
                                    }
                                }
                            );
                        }
                    );
                }
            );
            /**
             * Handle disconnects
             *
             * @listens disconnect
             */
            userSocket.on(
                disconnect,
                function () {
                    // TODO reconnect stuff here
                }
            );
        }
    );
};


/**
 * Creates a new specific card
 *
 * @constructor
 * @param {number|char} rank - the rank, 2-9 or T,J,Q,K,A
 * @param {char} suit - from Card.*
 */
var Card = function(rank, suit) {
    // make sure rank is correct
    if (!((2 <= rank <= 9) || rank === 'T' || rank === 'J' || rank === 'Q' || rank === 'K' || rank === 'A'  )) {
        console.log(rank);
        throw "Incorrect rank"
    }
    // make sure the suit is correct
    switch (suit) {
        case Card.DIAMONDS:
        case Card.CLUBS:
        case Card.SPADES:
        case Card.HEARTS:
            // everything is fine!
            break;
        default:
            console.log(suit);
            throw "Incorrect suit";
    }

    this.rank = rank;
    this.suit = suit;
};

/**
 * The Suit of our card
 *
 * @memberof! Card
 * @instance
 * @type {char}
 */
Card.prototype.suit = Card.DIAMONDS;

/**
 * The Rank of our card
 *
 * @memberof! Card
 * @instance
 * @type {number|char}
 */
Card.prototype.rank = 2;

/**
 * Return a string representation of this card
 *
 * @memberof Card
 * @instance
 * @method toString
 * @returns {string} String Representation
 */
Card.prototype.toString = function() {
    return [this.rank, this.suit].join('');
};

/**
 * Return a json representation of this card
 *
 * @method toJSON
 * @instance
 * @memberof Card
 * @returns {string} String Representation
 */
Card.prototype.toJSON = Card.prototype.toString;
/**
 * @memberof! Card
 * @static
 */
Card.DIAMONDS = 'd';
/**
 * @memberof! Card
 * @static
 */
Card.CLUBS = 'c';
/**
 * @memberof! Card
 * @static
 */
Card.SPADES = 's';
/**
 * @memberof! Card
 * @static
 */
Card.HEARTS = 'h';
/**
 * @memberof! Card
 * @static
 */
Card.JACK = 'J'
/**
 * @memberof! Card
 * @static
 */
Card.QUEEN = 'Q';
/**
 * @memberof! Card
 * @static
 */
Card.KING = 'K';
/**
 * @memberof! Card
 * @static
 */
Card.ACE = 'A';
/**
 * @memberof! Card
 * @static
 */
Card.RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 'T', Card.JACK, Card.QUEEN, Card.KING, Card.ACE];
/**
 * @memberof! Card
 * @static
 */
Card.SUITS = [Card.HEARTS, Card.SPADES, Card.CLUBS, Card.DIAMONDS];
/**
 * @memberof! Card
 * @function
 * @static
 * @param {Card} card -- the card to test
 */
Card.isActuallyACard = function (card) {
    return card.hasOwnProperty('rank') && card.hasOwnProperty('suit');
};

var Hand = function(cards) {
    // Check that we are in fact, cards
    if (!utils.all(Card.isActuallyACard, cards)) {
        throw "Not all items in hand are cards";
    }
    this.cards = cards;
};
Hand.prototype.cards = [];
Hand.prototype.getEval = function () {
    // TODO create a better representation
    return PokerEvaluator.evalHand(this.cards);
};
Hand.prototype.toJSON = function () {
    return {
        cards: this.cards.map(function (x) { return x.toJSON() }),
        stats: this.getEval()
    };
}

var Deck = function(cards) {
    // Check that we are in fact, cards
    if (!utils.all(Card.isActuallyACard, cards)) {
        throw "Not all items in hand are cards";
    }
    this.cards = cards;
};
Deck.prototype.cards = [];
Deck.prototype.toJSON = function () {
    return this.cards.map(
        function (card) {
            return card.toJSON();
        }
    );
};
Deck.prototype.toString = function () {
    return this.cards.join(',');
};
Deck.prototype.shuffle = function () {
    // Fischer-Yates Shuffle
    for (var i = this.cards.length -1; i--; i <= 1) {
        var j = Math.round(Math.random() * i);
        var temp = this.cards[i];
        this.cards[i] = this.cards[j];
        this.cards[j] = temp;
    }
};
Deck.prototype.pop = function () {
    return this.cards.pop();
};

var PokerDeck = function() {
    // have a place to store all 52 cards
    var cards = [];

    // Create all 52 cards, and fill cards
    Card.SUITS.forEach(
        function (suit) {
            Card.RANKS.forEach(
                function (rank) {
                    cards.push(new Card(rank, suit));
                }
            );
        }
    );

    // build a deck with these cards, and use it as the return value
    return new Deck(cards);
}

var Player = function(socket) {
    this.socket = socket;
};
Player.prototype.socket = null;
Player.prototype.hand = null;
Player.prototype.isReady = false;

var Table = function(room) {
    // we need the full DB object
    this.room = room;
};
Table.stages = {
    STARTED: 0,
    READY: 1,
    DEALT_HOLE_CARDS: 2,
    FLOP: 3,
    TURN: 4,
    RIVER: 5
};
Table.prototype.room = null;
Table.prototype.pot = 0;
Table.prototype.lastStage = Table.stages.STARTED;
Table.prototype.playingPlayersInOrder = [];
Table.prototype.dealToPlayers = function () {
    // We will create players.length piles of two cards, to simulate real dealing
    // Rather than popping two cards off at a time for a player
    var piles = [];
    var deck = this.room.deck;
    var players = this.players

    // make sure piles is full of arrays
    for (var i = 0; i < players.length; i++) {
        piles[i] = [];
    }

    // do this twice
    for (var i = 0; i <= 1; i++) {
        // for as many players as we have
        for (var j = 0; j < players.length; j++) {
            piles[j].push(deck.pop());
        }
    }

    // and... make hands out of'em to the dealer
    for (var i = 0; i < players.length; i++) {
        players[i].hand = new Hand(piles[i]);
    }

    // and finally, save the (changed) deck object into the room
    this.room.deck = deck;
    this.room.save();
};
Table.prototype.dealFlop = function () {
};
Table.prototype.dealTurn = function () {
};
Table.prototype.dealRiver = function () {
};
Table.prototype.isCanWeStart = function () {
    // Conditions:
    // Enough players
    // Everyone is ready
    // Current game not going on
    if (
        this.players.length >= MIN_PLAYERS_TO_START &&
        all(this.players, function (player) { return player.isReady }) &&
        this.lastStage === Table.stages.STARTED
   ) {
        return true;
   }
    return false;
}
// table.bet(player, data['amount']);
Table.prototype.bet = function (player, amount) {
}
Table.prototype.continue = function () {
    // deal next set of cards, or finish the game

    // go to the next stage
    this.lastStage = (this.lastStage + 1) % Table.stages.RIVER + 1

    switch (this.lastStage) {
        case Table.stages.STARTED:
            this.reset();
            break;
        case Table.stages.READY:
            break;
        case Table.stages.DEALT_HOLE_CARDS:
            this.dealToPlayers();
            break;
        case Table.stages.FLOP:
            this.dealFlop();
            break;
        case Table.stages.TURN:
            this.dealTurn();
            break;
        case Table.stages.RIVER:
            this.dealRiver();
            break;
    }
};
Table.prototype.reset = function () {
    // TODO game reset here + winners here
};



// Export everything
module.exports.game = game;
module.exports.Card = Card;
module.exports.Hand = Hand;
module.exports.Deck = Deck;
module.exports.PokerDeck = PokerDeck;
module.exports.Player = Player;
module.exports.Table = Table;
