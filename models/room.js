module.exports = function(sequelize, DataTypes) {
    return sequelize.define(
            "Room",
            {
                deck: DataTypes.STRING(155),
                name: DataTypes.STRING,
                buyin: DataTypes.DECIMAL
            }
    );
};
