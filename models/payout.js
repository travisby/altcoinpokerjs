module.exports = function(sequelize, DataTypes) {
    return sequelize.define(
            "Payout",
            {
                address: DataTypes.STRING(34),
                value: DataTypes.DECIMAL
            }
    );
};
