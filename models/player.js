module.exports = function(sequelize, DataTypes) {
    return sequelize.define(
            "Player",
            {
                hand: DataTypes.STRING(14),
                money: DataTypes.DECIMAL
            }
    );
};
