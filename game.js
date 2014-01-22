var utils = require('./utils.js')

module.exports.game = function(socketio) {
    socketio.on(
        'join',
        function (room) {
            console.log(room);
            socketio.join(room);
        }
    );
}


module.exports.SuitsObj = function() {
}
module.exports.SuitsObj.prototype.DIAMONDS = 'd';
module.exports.SuitsObj.prototype.CLUBS = 'c';
module.exports.SuitsObj.prototype.SPADES = 's';
module.exports.SuitsObj.prototype.HEARTS = 'h';

module.exports.Suit = new module.exports.SuitsObj();

module.exports.Card = function(rank, suit) {
    // make sure rank is correct
    if (!(2 >= rank >= 14)) {
        throw "Incorrect rank"
    }
    // make sure the suit is correct
    switch (suit) {
        case module.exports.Suit.DIAMONDS:
        case module.exports.Suit.CLUBS:
        case module.exports.Suit.SPADES:
        case module.exports.Suit.HEARTS:
            // everything is fine!
        default:
            throw "Incorrect suit";

        this.rank = rank;
        this.suit = suit;
    }
}
module.exports.Card.prototype.suit = module.exports.SuitsObj.prototype.DIAMONDS;
module.exports.Card.prototype.rank = 2;
module.exports.Card.prototype.toString = function() {
    return ''.join([this.rank, this.suit]);
}
module.exports.Card.isActuallyACard = function (card) {
    return card.hasOwnProperty('rank') && card.hasOwnProperty('suit');
}

module.exports.Hand = function(cards) {
    // Check that we are in fact, cards
    if (!utils.all(module.exports.Card.isActuallyACard, cards)) {
        throw "Not all items in hand are cards";
    }
    this.cards = cards;
}
module.exports.Hand.prototype.cards = [];

module.exports.Deck = function(cards) {
    // Check that we are in fact, cards
    if (!utils.all(module.exports.Card.isActuallyACard, cards)) {
        throw "Not all items in hand are cards";
    }
    this.cards = cards;
}
module.exports.Deck.prototype.cards = [];

module.exports.PokerDeck = function() {
}
