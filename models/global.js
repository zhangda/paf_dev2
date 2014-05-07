var mongoose = require('mongoose')

var conn = mongoose.createConnection('mongodb://localhost/nodebb', {server : {poolSize : 1}});
conn.on('error', function (err) {
  console.log(err)
})

var objectSchema = new mongoose.Schema({
    _key: {type:String,required:true},
    nextCid: Number,
    nextMid: Number,
    nextNid: Number,
    nextPid: Number,
    nextTid: Number,
    nextUid: Number,
    postCount: Number,
    topicCount: Number,
    userCount: Number
})

module.exports = conn.model('Object', objectSchema);
