const mysql = require('mysql');

var db_config = {
  host: 'eu-cdbr-west-03.cleardb.net',
  user: 'bf5fa0a9ee22ca',
  password: '926afccb',
  database: 'heroku_fbdf670ea4a03b7',
  connectionLimit: 20,
  dateStrings: 'DATE'
};

var db = mysql.createPool(db_config);

db.on('connection', function(connection) {
  console.log(new Date(), 'MySQL connection');

  connection.on('error', function(err) {
      console.error(new Date(), 'MySQL error', err.code);
  });
  connection.on('end', function(err) {
      console.error(new Date(), 'MySQL close');
  });
});

module.exports = db;
