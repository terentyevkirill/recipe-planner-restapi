var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();

var auth = require('../auth/auth_service');
var _ = require('underscore');

////////////* GET: get saved user preferences *////////////
router.get('', auth.authenticateToken, function(req, res) {
    var userId = req.userId;
    console.log(`GET /preferences for userId: ${userId}`);
    db.query("SELECT category, preference FROM user_preferences WHERE userId = ?", [ userId ], function(err, rows, fields) {
        if (err) {
            console.log("Error selecting from user_preferences");
            return res.status(500).send('Select error');
        }
        if (rows[0] == null) {
            console.log("No saved preferences found");
            return res.send(null);
        }
        // group preferences by category: { "category1" : [ "one", "two", "three" ], "category2" : [ ... ] , ... }
        var prefs = {};     // result
        rows.forEach(e => {
            var category = e.category;
            var preference = e.preference;
            if (!prefs.hasOwnProperty(category)) {
                prefs[category] = [ preference ];
            } else {
                prefs[category].push(preference);
            }
        });
        return res.json(prefs);
    });
});

////////////* POST: save user preferences *////////////
/* Accepts everything with right structure (check function), errors will not be are not thrown. 
If you add 3 new preferences and one already added, there won't be any conflict. 
If you send illegal preference, it won't be added but you won't be notified as well. */
router.post('', auth.authenticateToken, jsonParser, function(req, res) {
    var userId = req.userId;
    var prefs = req.body;
    try {check(prefs)} catch (err) { return res.status(400).send(err); }
    console.log(`POST /preferences with body: ${JSON.stringify(prefs)}`);
    var formattedPrefs = [];    // SQL-formatted array: [ { userId: 1, category : "cat1", preference: "pref1" }, { ... }, ...]
    // iterate through categories
    for (var category in prefs) {
        if (prefs.hasOwnProperty(category)) {
            prefs[category].forEach(preference => formattedPrefs.push({ userId: userId, category: category, preference: preference}))
        }
    }
    console.log(`Inserting into user_preferences: ${JSON.stringify(formattedPrefs)}`);
    // insert into user_preferences without throwing errors (if adding already existing preference, its fine. )
    db.query("INSERT IGNORE INTO user_preferences (userId, category, preference) VALUES ?",
        [ formattedPrefs.map(e => [ e.userId, e.category, e.preference ]) ],
        function(err, result) {
            if (err) {
                console.log("Error inserting into user_preferences");
                return res.status(500).send('Insertion error');
            }
            console.log(`Inserted. Result: ${JSON.stringify(result)}`);
            res.sendStatus(200);
        }
    );
});

////////////* PUT: save new user preferences (delete old ones) *////////////
/* Deletes all saved preferences for authenticated user and inserts there new ones, passed in body */;
router.put('', auth.authenticateToken, jsonParser, function(req, res) {
    var userId = req.userId;
    var prefs = req.body;
    try {check(prefs)} catch (err) { return res.status(400).send(err); }
    console.log(`PUT /preferences with body: ${JSON.stringify(prefs)}`);
    var formattedPrefs = [];    // SQL-formatted array: [ { userId: 1, category : "cat1", preference: "pref1" }, { ... }, ...]
    // iterate through categories
    for (var category in prefs) {
        if (prefs.hasOwnProperty(category)) {
            prefs[category].forEach(preference => formattedPrefs.push({ userId: userId, category: category, preference: preference}))
        }
    }
    console.log(`Deleting from user_preferences where userId: ${userId}`);
    db.query("DELETE FROM user_preferences WHERE userId = ?", [ userId ], function(err, result) {
        if (err) {
            console.log("Error deleting from user_preferences");
            return res.status(500).send('Deletion error');
        }
        console.log(`Deleted. Affected rows: ${result.affectedRows}`);
        console.log(`Inserting into user_preferences: ${JSON.stringify(formattedPrefs)}`);
        // insert into user_preferences without throwing errors (if adding already existing preference, its fine. )
        db.query("INSERT IGNORE INTO user_preferences (userId, category, preference) VALUES ?",
            [ formattedPrefs.map(e => [ e.userId, e.category, e.preference ]) ],
            function(err, result) {
                if (err) {
                    console.log("Error inserting into user_preferences");
                    return res.status(500).send('Insertion error');
                }
                console.log(`Inserted. Result: ${JSON.stringify(result)}`);
                res.sendStatus(200);
            }
        );
    });
});

////////////* DELETE: delete all saved preferences for current user *////////////
router.delete('', auth.authenticateToken, function(req, res) {
    var userId = req.userId;
    console.log(`DELETE /preferences`);
    console.log(`Deleting from user_preferences where userId: ${userId}`);
    db.query("DELETE FROM user_preferences WHERE userId = ?", [ userId ], function(err, result) {
        if (err) {
            console.log("Error deleting from user_preferences");
            return res.status(500).send('Deletion error');
        }
        console.log(`Deleted. Affected rows: ${result.affectedRows}`);
        res.sendStatus(200);
    });
});

module.exports = router;

/* Check received JSON body (only structure, not semantically) */
function check(prefs){      //Checks if request body is ok
    if(_.isEmpty(prefs)) throw 'Missing preferences';     //Checks if preferences exist (null or with no properties)
    // chech existing properties (if they are not empty arrays)
    for (var category in prefs) {
        if (prefs.hasOwnProperty(category)) {
            if (!Array.isArray(prefs[category]) || !prefs[category].length) throw 'Invalid object structure';
            // console.log(`category: ${category}, prefs: ${prefs[category]}`);
        }
    }
}