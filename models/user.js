var mongoose = require('mongoose')

var userSchema = new mongoose.Schema({
   username: {type:String,required:true, index:{unique:true} },
   password: {type:String, required:true },
   token: {type:String, required:true },
   updatetime: {type: Date, default: Date.now }
})

module.exports = mongoose.model('User', userSchema);