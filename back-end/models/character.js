var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;
var Character = new Schema({
  source: String,
  cid: String,
  name: String,
  description: String,
  thumbnail: String
});

module.exports = Mongoose.model('character', Character, 'character');
