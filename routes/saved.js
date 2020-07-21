var express = require('express');
var router = express.Router();
var https = require('https');
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();

var auth = require('../auth/auth_service');
var apiKey = require('../auth/api_service')


////////////* DELETE: delete recipe from calendar *////////////
router.delete('', auth.authenticateToken, jsonParser, function(req, res) {
    var recipeId = req.body.recipeId;
    var userId = req.userId;    
    
    try {check(recipeId)} catch (err) { return res.status(400).send(err); }
    
    console.log(`DELETE /saved with recipeId: ${recipeId} for userId: ${userId}`);
    db.query("DELETE FROM user_recipe_store WHERE recipeId = ? AND userId = ?", [ recipeId, userId ], function (err, result) {
        if (err) {
            console.log("Error deleting from user_recipe_store");
            return res.status(500).send('Deletion error');
        }
        if(result.affectedRows < 1) return res.status(400).send('Nothing to Delete');
        
        console.log(`Deleted recipe with id: ${recipeId} for user with id: ${userId}`);
        return res.sendStatus(200);
    });
});


/* POST: save recipe for user */
router.post('', auth.authenticateToken, jsonParser, function(req, res) {
    var recipeId = req.body.recipeId;
    var userId = req.userId;    // set up in middleware auth.authenticateToken

    try {check(recipeId)} catch (err) { return res.status(400).send(err); }

    console.log(`POST /saved with recipeId: ${recipeId} for userId: ${userId}`);
    db.query("INSERT INTO user_recipe_store (recipeId, userId) VALUES (?, ?)", [ recipeId, userId ], function (err, rows, fields) {
        if (err) {
            console.log("Error inserting into user_recipe_store");
            return res.status(500).send('Insertion error');
            // don't throw error, otherwise server crashes
        }
        console.log(`Recipe with id: ${recipeId} saved for user with id: ${userId}`);
        res.sendStatus(200);
    });
});

/* GET: get saved recipe's data for user */
router.get('', auth.authenticateToken, function(req, res) {
    var userId = req.userId;
    console.log(`GET /saved for useriD: ${userId}`);
    db.query("SELECT recipeId FROM user_recipe_store WHERE userId = ?", [ userId ], function(err, rows, fields) {
        if (err) {
            console.log("Error selecting from user_recipe_store");
            return res.status(500).send('Select error');
        }
        if (rows[0] == null) {
            console.log("Nothing found");
            return res.send(null);
        }
        // convert received json array to csv string for api call
        ids = rows.map(v => v.recipeId).join(',');
        console.log(`Saved recipe's ids: ${ids}`);
        https.get(`https://api.spoonacular.com/recipes/informationBulk?ids=${ids}&apiKey=${apiKey()}`, (apiResp) => {
            let data = '';
            apiResp.on('data', (chunk) => {
            data += chunk;
            });

            apiResp.on('end', () => {
                res.json(JSON.parse(data).reverse());
            });
        }).on("error", (err) => {
            console.log("Error: " + err.message);
            return res.sendStatus(500);
        });
    })
})


module.exports = router;

function check(recipeId){ //Checks if parameters are OK
    if(!recipeId) throw 'Missing Recipe ID';                                        //Checks if recipeId exists (and is not 0)
}