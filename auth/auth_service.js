const jwt = require("jsonwebtoken");

/* Check if token is give, if it corresponds to token secret, and if the decoded username exists in db */
exports.authenticateToken = function (req, res, next) {
    // Gather the jwt access token from the request header
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.sendStatus(401) // if there isn't any token
  
    jwt.verify(token, String(process.env.TOKEN_SECRET), (err, decoded) => {
      if (err) {
        console.log(err);
        return res.sendStatus(401);
      }
      console.log(`Username from token: ${decoded.username}`);
      db.query("SELECT * FROM user_account WHERE username = ?", [ decoded.username ], (err, rows, fields) => {
          if (err) {
              console.log(err);
              return res.sendStatus(500);
          }
          if (rows[0] == null) {    // if token is ok but encoded username is wrong (e.g. was deleted)
            console.log("Username from token is illegal")
            return res.sendStatus(401);
          }
          req.userId = rows[0].userId     // save authenticated user's id to request field
          req.username = decoded.username   // save authenticated user's id to request field
          console.log(`Authenticated. Username: ${decoded.username}`);
          next();   // pass the execution off to whatever request the client intended
      })
    })
  }

  exports.generateAccessToken = function (username) {
    return jwt.sign(username, process.env.TOKEN_SECRET);
  }