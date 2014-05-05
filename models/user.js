var mongoose = require('mongoose')

var conn = mongoose.createConnection('mongodb://localhost/nodebb');

var objectSchema = new mongoose.Schema({
   
})

module.exports = conn.model('Object', objectSchema);
