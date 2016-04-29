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
var fs = require('fs');
var multer = require('multer'); //node middleware primarily used for uploading files
var upload = multer({
    dest: 'upload' //establish the upload directory
});
var type = upload.single('file');
router.post('/upload', type, function(req, res, next) {
    console.log(req.file);
    console.log(req.file);
    //multer automatically stores the file in the upload directory with a random file name!
    // res.json(req.file);
    var targetPath = 'public/images/user-uploads/' + req.file.originalname;
    // res.json(target_path);
    // Now copy the file to the images/user-uploads directory
    fs.readFile(req.file.path, function(error, data) {
        fs.writeFile(targetPath, data, function(error) {
            if (!error) {
                fs.unlink(req.file.path, function(err) {
                    if (err) {
                        console.log("Error deleting temp upload file = " + req.file.path);
                    }
                });
            }
            if (error) {

                res.json("Error copying the file: " + error);
            } else {
                res.json('Success');
            }
        });
    });

});

var marvelApiKey = config.marvel.apiKey;
var marvelPrivateKey = config.marvel.privateKey;
var marvelHost = "gateway.marvel.com";

var mongoose = require('mongoose');

//setup to accomdate running on Heroku
var mongoUrl = process.env.MONGODB_URI ||
    process.env.MONGOHQ_URL ||
    'mongodb://localhost:27017/comicsBattle';

connection = mongoose.connect(mongoUrl);
var db = mongoose.connection;
db.on('error', function(err) {
    console.log('connection error', err);
});
db.once('open', function() {
    console.log('connected to mongodb.');
});

var Vote = require('../models/vote');
var Character = require('../models/character');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {
        title: 'Express'
    });
});
router.get('/clearcache', function(req, res, next) {
    Character.remove({}, function() {});
    res.json({
        status: 'ok',
        action: 'clear character cache'
    });
});

router.get('/showcache', function(req, res, next) {
    Character.find({}, function(error, document) {
        // console.log(document);
        res.json(document);
    });
});
//get all the characters and save to mongo
router.get('/updatecache', function(req, res, next) {
    var totalMarvelCharacters = 1485;
    var limit = 10;
    var offset = 0;
    // var maxIterations = 1;
    var maxIterations = Math.floor(totalMarvelCharacters / limit) + 1;
    // console.log("Max iterations = " + maxIterations);
    //-------------------
    var successCallBack = function(data) {
        for (var d = 0; d < data.length; d++) {
            addNew(data[d]);
        }
    };


    var errorCallBack = function(error) {
        console.log(error);
        res.json({
            status: 'error',
            action: 'reload cache'
        });
    };

    var responseData = {};
    for (var i = 0; i < maxIterations; i++) {
        marvelSearch(limit, offset, successCallBack, errorCallBack);
        offset += limit;
    }

    res.json({
        status: 'ok',
        action: 'reload cache'
    });
});

router.post('/vote', function(req, res, next) {
    var currIP = req.ip;
    var winner = req.body.winner;
    var loser = req.body.loser;

    var vote = new Vote();
    vote.userIP = currIP;
    vote.winner = winner;
    vote.loser = loser;

    // console.log(vote);
    vote.save(function(err, data) {
        if (err) {
            console.log("****** Error saving vote **********");
            console.log(err);
            console.log("***********************************");
        }
    });
    res.json({
        status: 'OK'
    });
});

router.get('/search', function(req, res, next) {
    Character.find({}, function(error, results) {
        res.json(results);
    });
});
//Check if we already have the character in mongo.
//if we don't then add it.
function addNew(mc) {
    // console.log(mc);
    Character.findOne({
        cid: mc.cid,
        source: mc.source
    }, function(err, char) {
        if (err) {
            console.log("Error looking up the charcter");
        } else {
            if (!char) {
                console.log("Found a new Marvel character " + mc.name);
                var character = new Character();
                character.source = 'marvel';
                character.cid = mc.cid;
                character.name = mc.name;
                character.description = mc.description;
                character.thumbnail = mc.thumbnail;
                character.save();
            } else {
                console.log("Already have " + mc.name);

            }
        }
    });
}

function parseResults(data) {
    var responseData = [];
    // console.log(data);
    data.results.forEach(function(val) {
        if (val.thumbnail.path.indexOf('image_not_available') === -1) {
            responseData.push({
                source: 'marvel',
                cid: val.id,
                name: val.name,
                description: val.description,
                thumbnail: val.thumbnail.path + '.' + val.thumbnail.extension
            });
        } else {
            //console.log(val.thumbnail.path);
        }
    });
    return responseData;
}

function marvelSearch(limit, offset, successCallBack, errorCallBack) {
    var _offset = offset || 0;
    var _limit = limit || 20;
    var ts = Math.floor(Math.random() * 100000);
    var hash = md5(ts + marvelPrivateKey + marvelApiKey);
    var marvelPath = "/v1/public/characters?" + encodeURI("ts=" + ts + "&apikey=" + marvelApiKey + "&hash=" + hash + "&offset=" + _offset + "&limit=" + _limit);
    // console.log(marvelHost + marvelPath);
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
                // responseData = [{
                //     name: " NO Data Found"
                // }];
                // console.log("Offset=" + _offset + " Limit=" + _limit);
                // console.log(responseData);
                // console.log(parsed);
            } else {
                responseData = parseResults(parsed.data);
            }
            successCallBack(responseData);
        });
        response.on('error', function(error) {
            errorCallBack(error);
        });
    });
}

module.exports = router;
