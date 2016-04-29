var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;
var Character = new Schema({
  id: String,
  name: String,
  description: String,
  thumbnail: String
});

module.exports = Mongoose.model('character', Character, 'character');
