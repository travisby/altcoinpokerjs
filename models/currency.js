module.exports = function(sequelize, DataTypes) {
    return sequelize.define(
            "Currency",
            {
                name: DataTypes.STRING(10),
                symbol: DataTypes.STRING(3)
            }
    );
};
