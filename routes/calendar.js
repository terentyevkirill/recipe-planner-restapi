var express = require('express');
var router = express.Router();
var https = require('https');
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();

var auth = require('../auth/auth_service');
var apiKey = require('../auth/api_service')


////////////* PATCH: Edit the date you assigned to a recipe *////////////
router.patch('', auth.authenticateToken, jsonParser, function(req, res) {
    var recipeId = req.body.recipeId;
    var userId = req.userId; // set up in middleware auth.authenticateToken
    var date = req.body.date; //the old date                                    //date-format : yyyy-MM-dd  (example: 2020-06-20)
    var newDate = req.body.newDate; //the date which will replace the old date
    
    try {check(recipeId, date, newDate)} catch (err) { return res.status(400).send(err); } //Check if parameters are all correct
    
    console.log(`PATCH /calender with recipeId: ${recipeId} for userId: ${userId} at date: ${date} with new date: ${newDate}`);
    db.query("UPDATE user_recipe_calendar SET calendar_date = ? WHERE recipeId = ? AND userId = ? AND calendar_date = ?", [newDate, recipeId, userId, date], function (err, result) {
        if (err) {
            console.log("Error editing user_recipe_calendar");
            return res.status(500).send('Updating error');
        }
        if(result.affectedRows < 1) return res.status(401).send('Nothing to Edit');
        
        console.log(`Updated the date for recipe with id: ${recipeId} by user with id: ${userId} from old date ${date} to new date ${newDate}`);
        return res.sendStatus(200);
    });
});


////////////* DELETE: delete recipe from store *////////////
router.delete('', auth.authenticateToken, jsonParser, function(req, res) {
    var recipeId = req.body.recipeId;
    var userId = req.userId;    
    var date = req.body.date;
    
    try {check(recipeId, date)} catch (err) { return res.status(400).send(err); }
    
    console.log(`DELETE /calender with recipeId: ${recipeId} for userId: ${userId} at date: ${date}`);
    db.query("DELETE FROM user_recipe_calendar WHERE recipeId = ? AND userId = ? AND calendar_date = ?", [ recipeId, userId, date ], function (err, result) {
        if (err) {
            console.log("Error deleting from user_recipe_calendar");
            return res.status(500).send('Deletion error');
        }
        if(result.affectedRows < 1) return res.status(400).send('Nothing to Delete');
        
        console.log(`Deleted recipe with id: ${recipeId} for user with id: ${userId} at date ${date}`);
        return res.sendStatus(200);
    });
});


////////////* POST: save recipe to calendar *////////////
router.post('', auth.authenticateToken, jsonParser, function(req, res) {
    var recipeId = req.body.recipeId;
    var userId = req.userId;   
    var date = req.body.date;
    
    try {check(recipeId, date)} catch (err) { return res.status(400).send(err); }
    
    console.log(`POST /calender with recipeId: ${recipeId} for userId: ${userId} at date: ${date}`);
    db.query("INSERT INTO user_recipe_calendar (recipeId, userId, calendar_date) VALUES (?, ?, ?)", [ recipeId, userId, date ], function (err, rows, fields) {
        if (err) {
            console.log("Error inserting into user_recipe_calendar");
            return res.status(500).send('Insertion error');
        }
        console.log(`Recipe with id: ${recipeId} saved for user with id: ${userId} at date ${date}`);
        res.sendStatus(200);
    });
});


////////////* GET: get saved recipe's data for user *////////////
router.get('', auth.authenticateToken, function(req, res) {
    var userId = req.userId;
    console.log(`GET /calendar for userId: ${userId}`);
    db.query("SELECT recipeId, calendar_date FROM user_recipe_calendar WHERE userId = ? ORDER BY calendar_date", [ userId ], function(err, rows, fields) {
        if (err) {
            console.log("Error selecting from user_recipe_calendar");
            return res.status(500).send('Select error');
        }
        if (rows[0] == null) {
            console.log("Calendar is Empty");
            return res.send(null);
        }
        // convert received json array to csv string for api call
        ids = rows.map(v => v.recipeId).join(',');
        dates = rows.map(v => v.calendar_date);
        https.get(`https://api.spoonacular.com/recipes/informationBulk?ids=${ids}&apiKey=${apiKey()}`, (apiResp) => {
            let data = '';
            apiResp.on('data', (chunk) => {
            data += chunk;
            });

            apiResp.on('end', () => {
                data = JSON.parse(data);
                for(let i = 0; i < data.length; i++){
                    var recipe = JSON.stringify(data[i])
                    data[i] = JSON.parse('\{"recipe" : ' + recipe + ', "date" : "' + dates[i] + '"\}')
                }
                res.json(data);
            });
        }).on("error", (err) => {
            console.log("Error: " + err.message);
            return res.sendStatus(500);
        });
    })
})

module.exports = router;

function check(recipeId, ...args){ //Checks if parameters are OK
    if(!recipeId) throw 'Missing Recipe ID';                                        //Checks if recipeId exists (and is not 0)
    if(String(recipeId).match(/^\d{1,7}$/) == null) throw 'Invalid Recipe ID';      //Checks if recipeId is a number (between 1 and 9.999.999)
    for(var date of args) {
        if(!date) throw 'Missing Date';                                             //Checks if Date exists
        if(date.match(/^\d{4}-\d{2}-\d{2}$/) == null) throw 'Invalid Date Format';  //Checks if date format is "yyyy-MM-dd"
    }
}