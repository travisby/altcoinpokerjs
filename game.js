// CONSTANTS
var MAX_PLAYERS = 10
var RECONNET_TIMEOUT_MS = 30 * 1000;

var utils = require('./utils.js');
var db = require('./models/');
var PokerEvaluator = require('poker-evaluator');

var rooms = {};
var game = function(socketio) {
    socketio.on(
        'connection',
        function (userSocket) {
            var player = new Player(userSocket);
            // user-specific handlers
            userSocket.on(
                'join',
                function (roomID) {
                    // get the Room object first...
                    db.Room.find(roomID).success(
                        function (room) {
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
                            userSocket.on(
                                'ready',
                                function () {

                                    // only ready if the game is ready-able
                                    if (!table.isGameBeingPlayed) {
                                        player.isReady = true;
                                    }

                                    if (table.isCanWeStart()) {
                                        table.dealToPlayers();
                                        table.players.forEach(
                                            function (player) {
                                                userSocket.emit(
                                                    'newPlayerCards',
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

                            userSocket.on(
                                'bet',
                                function (data) {
                                    if (table.canBet(player)) {
                                        table.bet(player, data['amount']);
                                        socketio.in(roomID).emit('bet', data);
                                    }
                                }
                            );
                        }
                    );
                }
            );
            userSocket.on(
                'disconnect',
                function () {
                    // TODO reconnect stuff here
                }
            );
        }
    );
};


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
Card.prototype.suit = Card.DIAMONDS;
Card.prototype.rank = 2;
Card.prototype.toString = function() {
    return [this.rank, this.suit].join('');
};
Card.prototype.toJSON = Card.prototype.toString;
Card.DIAMONDS = 'd';
Card.CLUBS = 'c';
Card.SPADES = 's';
Card.HEARTS = 'h';
Card.JACK = 'J'
Card.QUEEN = 'Q';
Card.KING = 'K';
Card.ACE = 'A';
Card.RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 'T', Card.JACK, Card.QUEEN, Card.KING, Card.ACE];
Card.SUITS = [Card.HEARTS, Card.SPADES, Card.CLUBS, Card.DIAMONDS];
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
Table.prototype.room = null;
Table.prototype.isGameBeingPlayed = false;
Table.prototype.pot = 0;
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
Table.prototype.isCanWeStart = function () {
    // Conditions:
    // Enough players
    // Everyone is ready
    // Current game not going on
    if (
        this.players.length >= MIN_PLAYERS_TO_START &&
        all(this.players, function (player) { return player.isReady }) &&
        !this.isGameBeingPlayed
   ) {
        return true;
   }
    return false;
}

// Export everything
module.exports.game = game;
module.exports.Card = Card;
module.exports.Hand = Hand;
module.exports.Deck = Deck;
module.exports.PokerDeck = PokerDeck;
module.exports.Player = Player;
module.exports.Table = Table;
