var utils = require('./utils.js');

module.exports.game = function(socketio) {
    socketio.on(
        'join',
        function (room) {
            console.log(room);
            socketio.join(room);
        }
    );
};


module.exports.Card = function(rank, suit) {
    // make sure rank is correct
    if (!(2 <= rank <= module.exports.Card.ACE)) {
        console.log(rank);
        throw "Incorrect rank"
    }
    // make sure the suit is correct
    switch (suit) {
        case module.exports.Card.DIAMONDS:
        case module.exports.Card.CLUBS:
        case module.exports.Card.SPADES:
        case module.exports.Card.HEARTS:
            // everything is fine!
            break;
        default:
            console.log(suit);
            throw "Incorrect suit";
    }

    this.rank = rank;
    this.suit = suit;
};
module.exports.Card.prototype.suit = module.exports.Card.DIAMONDS;
module.exports.Card.prototype.rank = 2;
module.exports.Card.prototype.toString = function() {
    return [this.rank, this.suit].join('');
};
module.exports.Card.prototype.toJSON = module.exports.Card.prototype.toString;
module.exports.Card.DIAMONDS = 'd';
module.exports.Card.CLUBS = 'c';
module.exports.Card.SPADES = 's';
module.exports.Card.HEARTS = 'h';
module.exports.Card.JACK = 11
module.exports.Card.QUEEN = 12;
module.exports.Card.KING = 13;
module.exports.Card.ACE = 14;
module.exports.Card.RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, module.exports.Card.JACK, module.exports.Card.QUEEN, module.exports.Card.KING, module.exports.Card.ACE];
module.exports.Card.SUITS = [module.exports.Card.HEARTS, module.exports.Card.SPADES, module.exports.Card.CLUBS, module.exports.Card.DIAMONDS];
module.exports.Card.isActuallyACard = function (card) {
    return card.hasOwnProperty('rank') && card.hasOwnProperty('suit');
};

module.exports.Hand = function(cards) {
    // Check that we are in fact, cards
    if (!utils.all(module.exports.Card.isActuallyACard, cards)) {
        throw "Not all items in hand are cards";
    }
    this.cards = cards;
};
module.exports.Hand.prototype.cards = [];

module.exports.Deck = function(cards) {
    // Check that we are in fact, cards
    if (!utils.all(module.exports.Card.isActuallyACard, cards)) {
        throw "Not all items in hand are cards";
    }
    this.cards = cards;
};
module.exports.Deck.prototype.cards = [];
module.exports.Deck.prototype.toJSON = function () {
    return this.cards.map(
        function (card) {
            return card.toJSON();
        }
    );
};
module.exports.Deck.prototype.toString = function () {
    return this.cards.join(',');
}
module.exports.Deck.prototype.shuffle = function () {
}

module.exports.PokerDeck = function() {
    // have a place to store all 52 cards
    var cards = [];

    // Create all 52 cards, and fill cards
    module.exports.Card.SUITS.forEach(
        function (suit) {
            module.exports.Card.RANKS.forEach(
                function (rank) {
                    cards.push(new module.exports.Card(rank, suit));
                }
            );
        }
    );

    // build a deck with these cards, and use it as the return value
    return new module.exports.Deck(cards);
};
