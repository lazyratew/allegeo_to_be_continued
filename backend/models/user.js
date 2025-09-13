//this collection is for login, signup user data & for allergies

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username:  { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  phone:     { type: String, required: true },
  password:  { type: String, required: true },
  allergies: { type: Map, of: String } // created for storing { allergen: severity }
}, { timestamps: true });


module.exports = mongoose.model('user', UserSchema);