var game = require('../game.js');


module.exports = function(sequelize, DataTypes) {
    return sequelize.define(
        "Room",
        {
            _deck: {
                type: DataTypes.STRING(159),
                defaultValue: JSON.stringify((new game.PokerDeck()).toJSON())
            },
            name: DataTypes.STRING,
            buyin: DataTypes.DECIMAL
        },
        {
            getterMethods : {
                deck : function () {
                    return new game.Deck(this._deck.split(',').map(
                        function (cardString) {
                            var rank = cardString[0];
                            var suit = cardString[1];
                            return new game.Card(rank, suit);
                        }
                    ));
                }
            },
            setterMethods : {
                deck: function (deck_obj) {
                    this._deck = JSON.stringify(deck_obj.toJSON());
                }
            }
        }
    );
};
