var mongoose = require('mongoose')

var conn = mongoose.createConnection('mongodb://localhost/paf_dev2');

var apiSchema = new mongoose.Schema({
   name: {type:String,required:true},
   key: {type:String, required:true,  index:{unique:true}},
   description:String,
   expanded: Boolean,
   isDisplay: Boolean,
   displayOrder: Number,
   parentId: {type:String, default:0},
   level: {type:Number, default:0},
   section: mongoose.Schema.Types.Mixed,
   children: mongoose.Schema.Types.Mixed,
   parent: mongoose.Schema.Types.Mixed
})

module.exports = conn.model('Api', apiSchema);
