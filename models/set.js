var mongoose = require('mongoose')

var conn = mongoose.createConnection('mongodb://localhost/nodebb', {server : {poolSize : 1}});
conn.on('error', function (err) {
  console.log(err)
})

var objectSchema = new mongoose.Schema({
    _key: {type:String,required:true},
    score: Number,
    value: Number
})

module.exports = conn.model('Object', objectSchema);
