var mongoose = require('mongoose')

var conn = mongoose.createConnection('mongodb://localhost/nodebb', {server : {poolSize : 1}});
conn.on('error', function (err) {
  console.log(err)
})

var objectSchema = new mongoose.Schema({
    // _key: {type:String,required:true},
    // banned: {type:Number, default:0},
    // birthday: {type:String, default:""},
    // email: {type:String, default:""},
    // fullname: {type:String, default:""},
    // gravatarpicture: {type:String, default:"https://secure.gravatar.com/avatar/d10ca8d11301c2f4993ac2279ce4b930?size=128&default=identicon&rating=pg"},
    // joindate: Number,
    // lastonline: Number,
    // lastposttime: {type:String, default:0},
    // location: {type:String, default:""},
    // password: {type:String,required:true},
    // picture: {type:String, default:"https://secure.gravatar.com/avatar/d10ca8d11301c2f4993ac2279ce4b930?size=128&default=identicon&rating=pg"},
    // postcount: {type:Number, default:0},
    // profileviews: {type:Number, default:0},
    // reputation: {type:Number, default:0},
    // signature: {type:String, default:""},
    // status: {type:String, default:"online"},
    // uid: {type:Number,required:true},
    // uploadedpicture: {type:String, default:""},
    // username: {type:String,required:true},
    // userslug: {type:String,required:true},
    // website: {type:String, default:""}

}, { strict: false } )

module.exports = conn.model('Object', objectSchema);
