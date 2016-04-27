var express = require('express');
var router = express.Router();
var http = require('http');
var md5 = require("blueimp-md5");
var config = require('./config');
//note: config.js is in the routes folder and has the following info
/*
var config = {};
config.marvel = {};
config.marvel.apiKey = {your api key}
config.marvel.privateKey = {your private key}
module.exports = config;
*/

var marvelApiKey = config.marvel.apiKey;
var marvelPrivateKey = config.marvel.privateKey;
var marvelHost = "gateway.marvel.com";

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/search', function(req, res, next) {
  var totalMarvelCharacters = 1485;
  var offset = Math.floor(Math.random() * 1001);
  var ts = Math.floor(Math.random() * 100000);
  var hash = md5(ts+marvelPrivateKey+marvelApiKey);
  console.log(ts);
  // res.json({dateTime: ts});
  var marvelPath = "/v1/public/characters?" + encodeURI("ts="+ts+"&apikey=" + marvelApiKey + "&hash=" + hash + "&offset=" + offset);
 console.log(marvelHost + marvelPath);
  http.get({
         host: marvelHost,
         path: marvelPath
      }, function(response) {
        // Continuously update stream with data
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
            var parsed = JSON.parse(body);
            var responseData = [];
            parsed.data.results.forEach(function(val) {

              if (val.thumbnail.path.indexOf('image_not_available') === -1) {
                responseData.push({
                    id: val.id,
                    name: val.name,
                    description: val.description,
                    thumbnail: val.thumbnail.path + '.' + val.thumbnail.extension,
                    attributionHTML: val.attributionHTML
                  });
                } else {
                  console.log(val.thumbnail.path);
                }
            });
            res.json(responseData);
        });
        response.on('error', function() {
          console.log("error");
        });
    });

});

module.exports = router;
