var utils = require('./utils.js');

var game = function(socketio) {
    socketio.on(
        'join',
        function (room) {
            console.log(room);
            socketio.join(room);
        }
    );
};


var Card = function(rank, suit) {
    // make sure rank is correct
    if (!(2 <= rank <= Card.ACE)) {
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
Card.JACK = 11
Card.QUEEN = 12;
Card.KING = 13;
Card.ACE = 14;
Card.RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, Card.JACK, Card.QUEEN, Card.KING, Card.ACE];
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
}
Deck.prototype.shuffle = function () {
    // Fischer-Yates Shuffle
    for (var i = this.cards.length -1; i--; i <= 1) {
        var j = Math.round(Math.random() * i);
        var temp = this.cards[i];
        this.cards[i] = this.cards[j];
        this.cards[j] = temp;
    }
}

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

module.exports.game = game;
module.exports.Card = Card;
module.exports.Hand = Hand;
module.exports.Deck = Deck;
module.exports.PokerDeck = PokerDeck;
