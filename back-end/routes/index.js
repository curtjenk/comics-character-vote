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

var mongoose = require('mongoose');
var mongoClient = require('mongodb').MongoClient;
//setup to accomdate running on Heroku
var mongoUrl = process.env.MONGODB_URI ||
    process.env.MONGOHQ_URL ||
    'mongodb://localhost:27017/comicsBattle';

var db;
mongoClient.connect(mongoUrl, function(error, database) {
    db = database;
});

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {
        title: 'Express'
    });
});

router.post('/vote', function(req, res, next) {
    var currIP = req.ip;
    var winner = req.body.winner;
    var loser = req.body.loser;
    console.log("****************");
    console.log("Winner = " + winner.id + ' ' + winner.name);
    console.log("Loser = " + loser.id + ' ' + loser.name);
    console.log("****************");
    // var col = db.collection('vote');
    db.collection('vote').insertOne({
        userIp: currIP,
        winner: winner,
        loser: loser
    }, function(err, result) {
        console.log(err);
        console.log(result);
        console.log("Inserted a document into the vote collection.");
    });
    res.json({
        status: 'Made It'
    });
});
router.get('/search', function(req, res, next) {
    var totalMarvelCharacters = 1485;
    var offset = Math.floor(Math.random() * 74);
    var ts = Math.floor(Math.random() * 100000);
    var hash = md5(ts + marvelPrivateKey + marvelApiKey);
    // console.log(ts);
    // res.json({dateTime: ts});
    var marvelPath = "/v1/public/characters?" + encodeURI("ts=" + ts + "&apikey=" + marvelApiKey + "&hash=" + hash + "&offset=" + offset);
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
            if (!parsed || !parsed.data) {
               responseData = [{name: " NO Data Found"}];
               console.log(responseData);
            } else {
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
            }
            console.log(responseData);
            res.json(responseData);
        });
        response.on('error', function() {
            console.log("error");
        });
    });
});

module.exports = router;
