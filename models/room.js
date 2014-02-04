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
                    return new game.Deck(
                        this._deck.split(',').map(
                            function (cardString) {
                                var rank = null;
                                var suit = null;
                                // then we must be a two-character thingy
                                if (cardString.length > 2) {
                                    rank = cardString[0] + cardString[1];
                                } else {
                                    rank = cardString[0];
                                }
                                suit = cardString[1];
                                return new game.Card(rank, suit);
                            }
                    ));
                }
            },
            setterMethods : {
                deck: function (deck_obj) {
                    this._deck = deck_obj.toString();
                }
            }
        }
    );
};
