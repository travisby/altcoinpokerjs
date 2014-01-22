var game = require('../game.js');


module.exports = function(sequelize, DataTypes) {
    return sequelize.define(
        "Room",
        {
            _deck: {
                type: DataTypes.STRING(159),
            },
            name: DataTypes.STRING,
            buyin: DataTypes.DECIMAL
        },
        {
            getterMethods : {
                deck : function () {
                    var charToRank = function(x) {
                        switch (x) {
                            case 'T':
                                return 10;
                            case 'J':
                                return 11;
                            case 'Q':
                                return 12;
                            case 'K':
                                return 13;
                            case 'A':
                                return 14;
                            default:
                                return x;
                        }
                    }
                    return new game.Deck(
                        this._deck.split(',').map(
                            function (cardString) {
                                // then we must be a two-character thingy
                                if (cardString.length > 2) {
                                    var rank = charToRank(cardString[0] + cardString[1]);
                                } else {
                                    var rank = charToRank(cardString[0]);
                                }
                                var suit = cardString[1];
                                return new game.Card(rank, suit);
                            }
                    ));
                }
            },
            setterMethods : {
                deck: function (deck_obj) {
                    this._deck = deck_obj.toString()
                        .replace(/10/g, 'T')
                        .replace(/11/g, 'J')
                        .replace(/12/g, 'Q')
                        .replace(/13/g, 'K')
                        .replace(/14/g, 'A');
                }
            }
        }
    );
};
