var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;
var Vote = new Schema(
  {
    userIP: String,
    winner: {
        source: String,
        cid: String,
        name: String,
        description: String,
        thumbnail: String
    },
    loser: {
        source: String,
        cid: String,
        name: String,
        description: String,
        thumbnail: String
    }
});

module.exports = Mongoose.model('vote', Vote, 'vote');
