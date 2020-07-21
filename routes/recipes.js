var express = require('express');
var router = express.Router();
var https = require('https');
var apiKey = require('../auth/api_service')

/* GET random recipes */
router.get('/random', function(req, res) {
  var params = {
      number: req.query.number,
      tags: req.query.tags
  }
  console.log(`number: ${params.number}; tags: ${params.tags}`);
  var query = '';
  if (params.number != undefined
      && Number(params.number) > 0
      && Number(params.number) < 100) {
      query = query + `number=${Number(params.number)}&`;
  }
  if (params.tags != undefined
      && String(params.tags) !== '') {
      query = query + `tags=${String(params.tags)}&`;
  }

  query = `?${query}apiKey=${apiKey()}`;
  console.log("Query string: " + query);
  https.get(`https://api.spoonacular.com/recipes/random${query}`, (apiResp) => {
      let data = '';
      apiResp.on('data', (chunk) => {
          data += chunk;
      });
      apiResp.on('end', () => {
          res.json(JSON.parse(data));
          // console.log(JSON.parse(data));
      });
  }).on("error", (err) => {
      console.log("Error: " + err.message);
      return res.sendStatus(500);
  });
});

/* GET recipes by query (search) */
router.get('/search', function(req, res){
  var searchTerm = /\S/.test(req.query.query) ? req.query.query : null; //Query cannot be whitespace-only
  var number = req.query.number ? req.query.number : 10; //Standard amount if no amount is specified in URL. : 10
  if(isNaN(number) || number > 50) number = null; //Maximum amount : 50
    
  var cuisines = req.query.cuisine ? ("&cuisine=" + (req.query.cuisine).toLowerCase()) : "";
  var intolerances = req.query.intolerances ? ("&intolerances=" + (req.query.intolerances).toLowerCase()) : "";
  var diets = req.query.diet ? ("&diet=" + (req.query.diet).toLowerCase()) : "";
    
  if(searchTerm && number){
      https.get(`https://api.spoonacular.com/recipes/search?query=${searchTerm}&number=${number}${cuisines}${intolerances}${diets}&apiKey=${apiKey()}` , (apiResp) => {
          let data = '';
          apiResp.on('data', (chunk) => {
          data += chunk;
          });

          apiResp.on('end', () => {
              res.json(JSON.parse(data));
          });

      }).on("error", (err) => {
          console.log("Error: " + err.message);
          return res.sendStatus(500);
      });
  } else {
      res.send(null);
      console.log("Invalid Arguments");
  }
});


/* GET recipe by id. */
router.get('/:id', function(req, res) {
  https.get(`https://api.spoonacular.com/recipes/${req.params.id}/information?apiKey=${apiKey()}` , (apiResp) => {
    let data = '';
    apiResp.on('data', (chunk) => {
      data += chunk;
    });

    apiResp.on('end', () => {
      res.json(JSON.parse(data));
      // console.log(JSON.parse(data));
    });

  }).on("error", (err) => {
    console.log("Error: " + err.message);
    return res.sendStatus(500);
  });

});

module.exports = router;
