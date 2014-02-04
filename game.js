// loaded modules
var utils = require('./utils.js');
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
var MAX_PLAYERS = 10;

/**
 * Mininum number of players to start a game
 * @const {number}
 */
var MIN_PLAYERS_TO_START = 1;

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
 * @param {Sequelize} db
 */
var game = function(socketio, db) {
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
            console.log("Listened to a connection event");

            /**
             * The currently connected user as a player
             * @type {Player}
             */
            var player;
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
                    console.log("Listened to a join event");
                    // get the Room object first...
                    db.Room.find(roomID.roomID).success(
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

                            // instantiate our user now
                            player = new Player(userSocket, parseInt(room.buyin));
                            userSocket.join(room);

                            // if we haven't instantiated anything yet...
                            if (!(room.id in rooms)) {
                                rooms[room.id] = new Table(room);
                            }
                            table = rooms[room.id];

                            // add our user if we are not full to the table
                            if (table.players.length < MAX_PLAYERS) {
                                console.log("adding player to table");
                                table.players.push(player);
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
                                    console.log("Listened to a ready event");

                                    // only ready if the game is ready-able and the table needs more players
                                    if (!table.isGameBeingPlayed()) {
                                        player.isReady = true;
                                    }
                                    var x = table.continue();

                                    if (x) {
                                        table.players.forEach(

                                            /**
                                             * For every player, let them know their cards
                                             *
                                             * @fires newPlayerCards
                                             */
                                            function (player) {
                                                player.socket.emit(
                                                    newPlayerCards,
                                                    player.hand.toJSON()
                                                );
                                            }
                                        );
                                        // tell the entire room cards have been dealt
                                        userSocket.broadcast.to(room.id).emit('deal');
                                        userSocket.emit('deal');
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
                                    console.log("Listened to a bet event");
                                    console.log(data);
                                    if (table.canBet(player)) {
                                        console.log("doing bet");
                                        table.bet(player, data.amount);
                                        userSocket.broadcast.to(room.id).emit('bet');
                                        userSocket.emit('bet');
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
                    console.log("Listened to a disconnect event");
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
 * @param {(number|char)} rank - the rank, 2-9 or T,J,Q,K,A
 * @param {char} suit - from Card.*
 */
var Card = function(rank, suit) {
    this.rank = null;
    this.suit = null;

    // make sure rank is correct
    if (!((2 <= rank <= 9) || rank === 'T' || rank === 'J' || rank === 'Q' || rank === 'K' || rank === 'A'  )) {
        console.log(rank);
        throw "Incorrect rank";
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
 * @type {(number|char)}
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
Card.JACK = 'J';
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

/**
 * Hand object
 *
 * @constructor
 * @param {Card[]} cards - list of cards
 */
var Hand = function(cards) {
    this.cards = [];
    // Check that we are in fact, cards
    if (!utils.all(Card.isActuallyACard, cards)) {
        throw "Not all items in hand are cards";
    }
    this.cards = cards;
};

/**
 * List of cards
 *
 * @memberof! Hand
 * @instance
 * @type {Card[]}
 */
Hand.prototype.cards = [];

/**
 * Get the evaluated hand representation
 *
 * @memberof Hand
 * @instance
 * @method
 * @returns {object}
 */
Hand.prototype.getEval = function () {
    // TODO create a better representation
    // return PokerEvaluator.evalHand(this.cards);
};

/**
 * Gets a JSONic representation of this hand
 *
 * @memberof Hand
 * @instance
 * @method
 * @returns {object}
 */
Hand.prototype.toJSON = function () {
    return {
        cards: this.cards.map(function (x) { return x.toJSON(); }),
        stats: this.getEval()
    };
};

/**
 * Deck object that holds many cards
 * @constructor
 * @param {Card[]} cards - list of cards in the deck
 */
var Deck = function(cards) {
    this.cards = [];

    // Check that we are in fact, cards
    if (!utils.all(Card.isActuallyACard, cards)) {
        throw "Not all items in hand are cards";
    }
    this.cards = cards;
};

/**
 * @memberof! Deck
 * @instance
 * @type {Card[]}
 */
Deck.prototype.cards = [];

/**
 * Gets a JSONic representation of this deck
 *
 * @memberof Deck
 * @instance
 * @method
 * @returns {object}
 */
Deck.prototype.toJSON = function () {
    return this.cards.map(
        function (card) {
            return card.toJSON();
        }
    );
};

/**
 * Gets a string representation of this deck
 *
 * @memberof Deck
 * @instance
 * @method
 * @returns {string}
 */
Deck.prototype.toString = function () {
    return this.cards.join(',');
};

/**
 * Shuffles the deck of cards
 *
 * @memberof Deck
 * @method
 */
Deck.prototype.shuffle = function () {
    // Fischer-Yates Shuffle
    for (var i = this.cards.length -1; i--; i <= 1) {
        var j = Math.round(Math.random() * i);
        var temp = this.cards[i];
        this.cards[i] = this.cards[j];
        this.cards[j] = temp;
    }
};

/**
 * Gets one card from the top of the deck
 *
 * @memberof Deck
 * @method
 */
Deck.prototype.pop = function () {
    return this.cards.pop();
};

/**
 * Builds a deck suitable for playing poker
 *
 * @returns{Deck} - deck with your ordinary French Deck 52 cards
 */
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
};

/**
 * Player object
 *
 * @constructor
 * @param {SocketIO} socket - socket for the specific user
 * @param {number} coin - how much money they are playing with
 */
var Player = function(socket, coin) {
    this.socket = null;
    this.coin = 0;
    this.hand = null;
    this.isReady = false;

    this.socket = socket;
    this.coin = coin;
};

/**
 * Handle of the user's socket
 *
 * @memberof! Player
 * @instance
 * @type {SocketIO}
 */
Player.prototype.socket = null;

/**
 * The amount of money the player has to play with
 * 
 * @memberof! Player
 * @instance
 * @type {number}
 */
Player.prototype.coin = 0;

/**
 * The player's current two-card hand
 *
 * @memberof! Hand
 * @instance
 * @type {Hand}
 */
Player.prototype.hand = null;

/**
 * Did this player ready-up?
 *
 * @memberof! Hand
 * @instance
 * @type {bool}
 */
Player.prototype.isReady = false;

/**
 * Table of a poker room
 *
 * @constructor
 * @param {db.Room} room - one specific room that we will update with our info
 */
var Table = function(room) {
    this.room = null;
    this.players = [];
    this.pot = 0;
    this.lastStage = Table.stages.LOADED;
    this.cards = [];
    this.playerBetManager = new PlayerBetManager([]);
    // we need the full DB object

    // deal a new deck
    this.deck = PokerDeck();
    this.deck.shuffle();
    this.room = room;
    this.playerBetManager = new PlayerBetManager([]);
};

/**
 * Different stages that we could be in
 *
 * @enum {number}
 * @readonly
 * @memberof! Table
 * @static
 */
Table.stages = {
    LOADED: 0,
    DEALT_HOLE_CARDS: 1,
    FLOP: 2,
    TURN: 3,
    RIVER: 4
};

/**
 * Room Object
 * 
 * @memberof! Table
 * @instance
 * @type {Room}
 */
Table.prototype.room = null;

/**
 * Players of a particular table
 * @memberof! Table
 * @instance
 * @type {Player[]}
 */
Table.prototype.players = [];

/**
 * The cash money in the pot
 *
 * @memberof! Table
 * @instance
 * @type {number}
 */
Table.prototype.pot = 0;

/**
 * The last stage we completed
 *
 * @memberof! Table
 * @instance
 * @type {number}
 */
Table.prototype.lastStage = Table.stages.LOADED;

/**
 * Current cards on the table
 * @memberof! Table
 * @instance
 * @type {Card[]}
 */
Table.prototype.cards = [];

/**
 * player bet manager obj
 *
 * @memberof! Table
 * @instance
 * @type {PlayerBetManager}
 */
Table.prototype.playerBetManager = null;

/**
 * Get the next betting player
 *
 * @memberof Table
 * @instance
 * @method
 * returns {Player}
 */
Table.prototype.getNextBetter = function () {
    return this.playerBetManager.nextBetter().player;
};

/**
 * Deal hole cards to players
 *
 * @memberof Table
 * @instance
 * @method
 */
Table.prototype.dealToPlayers = function () {
    // We will create players.length piles of two cards, to simulate real dealing
    // Rather than popping two cards off at a time for a player
    var piles = [];
    var deck = this.deck;
    var players = this.players;

    // make sure piles is full of arrays
    for (var i = 0; i < players.length; i++) {
        piles[i] = [];
    }

    // do this twice
    for (i = 0; i <= 1; i++) {
        // for as many players as we have
        for (var j = 0; j < players.length; j++) {
            piles[j].push(deck.pop());
        }
    }

    // and... make hands out of'em to the dealer
    for (i = 0; i < players.length; i++) {
        players[i].hand = new Hand(piles[i]);
    }

    // and finally, save the (changed) deck object into the room
    // TODO Uncomment
    this.deck = deck;
    this.room.save();
};

/**
 * @type {Deck}
 */
Table.prototype.deck = PokerDeck();

/**
 * Deal the flop to the table
 *
 * @memberof Table
 * @instance
 * @method
 * @todo do it
 */
Table.prototype.dealFlop = function () {
    for (var i = 0; i < 3; i ++) {
        var deck = this.deck;
        this.cards.push(deck.pop());
        this.deck = deck;
        this.room.save();
    }
};

/**
 * Deal the turn to the table
 *
 * @memberof Table
 * @instance
 * @method
 */
Table.prototype.dealTurn = function () {
    var deck = this.deck;
    this.cards.push(deck.pop());
    this.deck = deck;
    this.room.save();
};

/**
 * Deal the river to the table
 *
 * @memberof Table
 * @instance
 * @method
 */
Table.prototype.dealRiver = function () {
    var deck = this.deck;
    this.cards.push(deck.pop());
    this.deck = deck;
    this.room.save();
};

/**
 * Can we start the game?
 *
 * @memberof Table
 * @instance
 * @method
 * @returns {bool}
 */
Table.prototype.isCanWeStart = function () {
    // Conditions:
    // Enough players
    // Everyone is ready
    // Current game not going on
    if (
        this.players.length >= MIN_PLAYERS_TO_START &&
        all(this.players, function (player) { return player.isReady; }) &&
        this.lastStage === Table.stages.LOADED
   ) {
        return true;
   }
    return false;
};

Table.prototype.isGameBeingPlayed = function () {
    // our game is always being played UNLESS we are in the "LOADED" stage
    return this.lastStage != Table.stages.LOADED;
};

/**
 * Perform a bet for a player
 * @memberof Table
 * @instance
 * @method
 * @param {Player} player - betting player
 * @param {number} amount - amount bet
 */
Table.prototype.bet = function (player, amount) {
    this.playerBetManager.bet(player, amount);
};

/**
 * Decide whether a particular player CAN bet right now
 * @memberof Table
 * @instance
 * @method
 * @param {Player} player - the player we want to know about
 */
Table.prototype.canBet = function (player) {
    return (this.getNextBetter() === player && this.isGameBeingPlayed());
};

/**
 * Can we continue?
 *
 * @memberof Table
 * @instance
 * @method
 * @returns {bool}
 */
Table.prototype.isCanWeContinue = function () {
    switch (this.lastStage) {
        // to continue after having started a game... players must be ready
        case Table.stages.LOADED:
            return utils.all(function (player) { return player.isReady; }, this.players);
        // to continue after hole cards have been dealt, betting rounds must have occurred
        case Table.stages.DEALT_HOLE_CARDS:
            return !this.playerBetManager.nextBetter();
        // to continue after flop cards have been dealt, betting rounds must have occurred
        case Table.stages.FLOP:
            return !this.playerBetManager.nextBetter();
        // to continue after turn card has been dealt, betting rounds must have occurred
        case Table.stages.TURN:
            return !this.playerBetManager.nextBetter();
        // to continue after river card has been dealt, betting rounds must have occurred
        case Table.stages.RIVER:
            return !this.playerBetManager.nextBetter();
    }

    return false;
};

/**
 * Move on to the next stage of the game.  Returns success
 *
 * @memberof Table
 * @instance
 * @method
 * @returns {bool}
 */
Table.prototype.continue = function () {
    if (!this.isCanWeContinue()) {
        return false;
    }
    // deal next set of cards, or finish the game

    // go to the next stage
    this.lastStage = (this.lastStage + 1) % (Table.stages.RIVER + 1);

    switch (this.lastStage) {
        case Table.stages.STARTED:
            console.log("rewarding winner");
            break;
        case Table.stages.READY:
            // reset game
            console.log("Game getting readied");
            break;
        case Table.stages.DEALT_HOLE_CARDS:
            // create a new bet manager
            this.playerBetManager = new PlayerBetManager(this.players);
            console.log("Dealing to players");
            this.dealToPlayers();
            break;
        case Table.stages.FLOP:
            console.log("Dealing flop");
            this.dealFlop();
            break;
        case Table.stages.TURN:
            console.log("Dealing turn");
            this.dealTurn();
            break;
        case Table.stages.RIVER:
            console.log("Dealing river");
            this.dealRiver();
            this.reset();
            break;
    }

    // create a new bet manager holding order (and missing elements) from the previous
    // because it is used only per-round
    this.playerBetManager = new PlayerBetManager(this.playerBetManager.players());

    return true;
};

/**
 * Reset the game to a replayable state
 *
 * @memberof Table
 * @instance
 * @method
 */
Table.prototype.reset = function () {
    // TODO game reset here + winners here
    
    // rotate the players array to change betting order... if we have >= 1 players
    if (this.players.length >= 1) {
        this.players.push(this.players[0]);
        this.players.shift();
    } else {
        throw "player array is empty.  What should I do?";
    }
};

/**
 * Object to hold a player's bet for a round
 * 
 * @constructor
 * @param {Player} player - betting player
 * @param {number} [amount=0] - Amount bet.
 */
PlayerBet = function(player, amount) {
    this.player = null;
    this.amount = 0;

    amount = typeof amount !== 'undefined' ? amount : 0;
    this.player = player;
    this.amount = amount;
};

/**
 * Player responsible for a bet
 *
 * @memberof! PlayerBet
 * @instance
 * @type {Player}
 */
PlayerBet.prototype.player = null;

/**
 * Amount a player has bet so far this round
 *
 * @memberof! PlayerBet
 * @instance
 * @type {number}
 */
PlayerBet.prototype.amount = 0;

/**
 * Place bet
 *
 * @memberof PlayerBet
 * @instance
 * @param {number} amount to bet
 */
PlayerBet.prototype.bet = function (amount) {
    this.amount += amount;
};

/**
 * Object to manage all of the bets for players
 *
 * @constructor
 * @param {Player[]} players - list of players to manage, in betting order
 */
var PlayerBetManager = function (players) {
    this.lastBetterIndex = -1;
    this.playerBets = [];
    this.playersWhoRaised = [];

    var manager = this;
    players.forEach(
        function (player) {
            manager.playerBets.push(new PlayerBet(player, 0));
    }
    );

};

/**
 * The index of the next person who should bet
 *
 * -1 means we have not had player 0 bet yet
 *  player.length means we've reached the end, and player 0 should bet
 * @memberof! PlayerBetManager
 * @instance
 * @type {number}
 */
PlayerBetManager.prototype.lastBetterIndex = -1;

/**
 * Get all of the players our PlayerBetManager is Managing bets for
 *
 * @memberof PlayerBetManager
 * @instance
 * @method
 * @returns {Player[]} - all players in the PlayerBetManager
 */
PlayerBetManager.prototype.players = function () {
    return this.playerBets.map(
        function (playerBet) {
            return playerBet.player;
        }
    );
};

/**
 * Return the next required PlayerBet that at least must occur
 * e.g. the next player in line MUST bet (at least)10, or MUST bet (at least) 0
 *
 * false if there are no possible bets left
 *
 * @memberof PlayerBetManager
 * @instance
 * @method
 * @returns {(PlayerBet|bool)}
 */
PlayerBetManager.prototype.nextBetter = function () {
    var previousBetter = this.playerBets[this.lastBetterIndex];
    var nextBetter = this.playerBets[(this.lastBetterIndex + 1) % this.playerBets.length];

    // this means no one has bet yet
    if (this.lastBetterIndex === -1) {
        // in that case, we want the very first player
        return this.playerBets[0];
    }

    // TODO this better.  It's technically incorrect poker
    // if the previous better was the LAST person in the circle, and everyone is fronting the same money
    // we can move forward
    if ((this.lastBetterIndex === this.playerBets.length - 1) && utils.all(function (playerBet) { return playerBet.amount === previousBetter.amount; }, this.playerBets)) {
        return false;
    }

    // if that wasn't the case, we can say who the next better is, and how much they need to bet
    return new PlayerBet(nextBetter.player, (previousBetter.amount - nextBetter.amount));
};

/**
 * The players in a bet manager
 *
 * @memberof! PlayerBetManager
 * @instance
 * @type {PlayerBet[]}
 */
PlayerBetManager.prototype.playerBets = [];

/**
 * All players who have raised this round
 *
 * @memberof! PlayerBetManager
 * @instance
 * @type {Player[]}
 */ 
PlayerBetManager.prototype.playersWhoRaised = [];

/**
 * Decides if the player has bet so far
 *
 * @memberof PlayerBetManager
 * @instance
 * @method
 * @param {Player} player - the player who we're questioning about
 * @returns {bool}
 */
PlayerBetManager.prototype.isHasPlayerBet = function (player) {
    // if this is NOT -1, then player has bet
    return this.playersWhoRaised.indexOf(player) != -1;
};

/**
 * Bet for a player
 *
 * @memberof PlayerBetManager
 * @instance
 * @method
 * @param {Player} player - better
 * @param {amount} amount - amount bet
 */
PlayerBetManager.prototype.bet = function (player, amount) {
    // can THIS player make that bet?
    if (player.coin < amount) {
        throw "User does not have enough money to play";
    }

    // is he folding?
    if (amount <= 0 && utils.any(function (playerBet) { return playerBet.amount > amount; }, this.playerBets)) {
        var test = this.playerBets.length;
        this.playerBets.splice(this.playerBets.indexOf(this.getPlayerBetByPlayer(player)), 1);

        if (this.playerBets.length >= test) {
            throw "something went wrong removing a user...";
        }
    }

    // can all other players HANDLE this bet?
    // TODO handle sidepots
    if (!(utils.all(function (player) { return player.coin >= amount; }, this.players()))) {
        throw "Not every player can afford that";
    }

    // subtract the amount from the player
    player.coin -= amount;
    // commit bet
    this.getPlayerBetByPlayer(player).bet(amount);
    // rotate the index
    this.lastBetterIndex = (this.lastBetterIndex + 1) % this.playerBets.length;
    this.playersWhoRaised.push(player);
};

/**
 * Get the given player's PlayerBet object
 *
 * @memberof PlayerBetmanager
 * @instance
 * @protected
 * @method
 * @param {Player}
 * @returns {PlayerBet}
 */
PlayerBetManager.prototype.getPlayerBetByPlayer = function (player) {
    for (var i = 0; i < this.playerBets.length; i++) {
        var ourPlayerBet = this.playerBets[i];
        if (ourPlayerBet.player === player ) {
            return ourPlayerBet;
        }
    }
    throw "Can't find him!";
};

// Export everything
module.exports.game = game;
module.exports.Card = Card;
module.exports.Hand = Hand;
module.exports.Deck = Deck;
module.exports.PokerDeck = PokerDeck;
module.exports.Player = Player;
module.exports.Table = Table;
