var express = require('express');
var router = express.Router();
var https = require('https');
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()

var auth = require('../auth/auth_service');
var apiKey = require('../auth/api_service');

/* POST login */
router.post('/login', jsonParser, function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  console.log(`POST /users/login with username: ${username}; password: ${password}`)
  /* return different error codes on incorrect login and password */
  db.query("SELECT userId FROM user_account WHERE username = ? and password = ?", [ username, password ], function (err, rows, fields) {
    if (err) {
      console.log(err);
      return res.sendStatus(500);
    }
    if (rows[0] != null) {
      console.log(`Found user w/ id: ${rows[0].userId}`);
      var token = auth.generateAccessToken({ username: username });
      return res.status(200).json({username: username, token: token});
    } 
    console.log('User not found');
    res.sendStatus(401);
  })
});

/* POST register */
router.post('/register', jsonParser, function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  console.log(`POST /users/register with username: ${username}; password: ${password}`)
  db.query("SELECT COUNT(*) as total FROM user_account WHERE username = ?", [ username ], function (err, rows, fields) {
    if (err) {
      console.log(err);
      return res.sendStatus(500);
    }
    if (rows[0].total == 0) {
      db.query("INSERT INTO user_account (username, password) VALUES (?, ?)", [ username, password ], function (err, rows, fields) {
        if (err) {
          console.log("Error inserting into user_account");
          return res.status(500).send('Error inserting into user_account');         
        }
        console.log("New user inserted");
      })
      var token = auth.generateAccessToken({ username: username })
      res.status(200).json({username: username, token: token});  
    } else {
      console.log(`User ${username} already exists in database`);
      res.status(409).send(`Username ${username} already exists`);
    }
  })
});

/* DELETE user (unregister) */
router.delete('', auth.authenticateToken, jsonParser, function(req, res) {
  username = req.username;
  password = req.body.password;
  try {check(password)} catch (err) { return res.status(400).send(err); }
  console.log(`DELETE /users with username (from token): ${username} and password: ${password}`);
  db.query("DELETE FROM user_account WHERE username = ? AND password = ?", [ username, password ], function (err, rows, fields) {
    if (err) {
      console.log(err);
      return res.sendStatus(500);
    }
    if (rows.affectedRows == 0) {
      return res.status(400).send("Wrong password");
    }
    console.log(`Deleted user with username: ${username} and password: ${password}`);
    res.sendStatus(200);
  })
})

/* Authentication endpoint */
router.get('/auth', auth.authenticateToken, function(req, res) {
  res.status(200).json({ username: req.username });
})


function exitHandler(options, err) {
  connection.end();
  if (options.cleanup)
      console.log('clean');
  if (err)
      console.log(err.stack);
  if (options.exit)
      process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null, {cleanup: true}));

function check(password){ //Checks if parameters are OK
  if(!password) throw 'Missing password';
}


module.exports = router;
