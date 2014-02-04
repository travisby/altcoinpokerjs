if (!global.hasOwnProperty('db')) {
  var Sequelize = require('sequelize');
  var sequelize = null;
 
  if (process.env.HEROKU_POSTGRESQL_BRONZE_URL) {
    // the application is executed on Heroku ... use the postgres database
    var match = process.env.HEROKU_POSTGRESQL_BRONZE_URL.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
 
    sequelize = new Sequelize(match[5], match[1], match[2], {
      dialect:  'postgres',
      protocol: 'postgres',
      port:     match[4],
      host:     match[3],
      logging:  true //false
    });
  } else {
    // the application is executed on the local machine ... use sqlite
    var sequelize = new Sequelize(
        'database',
        'username',
        '',
        {
            dialect: 'sqlite',
            storage: 'data.db'
        }
    );
  }
 
  global.db = {
    Sequelize: Sequelize,
    sequelize: sequelize,
    User:      sequelize.import(__dirname + '/user'),
    Room:      sequelize.import(__dirname + '/room'),
    Player:    sequelize.import(__dirname + '/player'),
    Payout:    sequelize.import(__dirname + '/payout'),
    Currency:  sequelize.import(__dirname + '/currency')
  };
 
  /*
    Associations can be defined here. E.g. like this:
    global.db.User.hasMany(global.db.SomethingElse)
  */
  global.db.Room.hasMany(global.db.Player);
  global.db.Player.belongsTo(global.db.Room);

  global.db.User.hasMany(global.db.Player);
  global.db.Player.belongsTo(global.db.User);

  global.db.User.hasMany(global.db.Payout);
  global.db.Payout.belongsTo(global.db.User);

  global.db.Currency.hasMany(global.db.Payout);
  global.db.Payout.belongsTo(global.db.Currency);

  global.db.Currency.hasMany(global.db.Room);
  global.db.Room.belongsTo(global.db.Currency);
}

module.exports = global.db;
