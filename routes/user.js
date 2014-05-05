var async = require('async');
var User = require('../models/user');

exports.list = function(req,res){
  User.find().exec(function(err, users){
  	return res.json(users)
  })
}