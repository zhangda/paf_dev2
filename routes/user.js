var async = require('async');
var Global = require('../models/global');
var User = require('../models/user');
var Group = require('../models/group');
var bcrypt = require('bcryptjs');
var utils = require('./utils');
var Set = require('../models/set');

exports.list = function(req,res){
  User.find({_key:{$regex:/^user:.*/}}).exec(function(err, users){
  	if(err) return res.json(400,{info:{code:'', message:err.err}});
  	return res.json(users)
  })
}

exports.create = function(req,res){
  var user = new User(req.body)
  var now = Date.now()
  user.lastonline = now
  user.joindate = now
  var userslug = utils.slugify(user.username);
  async.parallel([
  	function(callback){
      Global.findOne({_key:'global'}).exec(function(err, global){
  	    if(err) return callback(err)
        callback(null, global)
  	  })
  	},
  	function(callback){
	  Group.findOne({_key:'group:registered-users:members'}).exec(function(err,group){
  		if(err) return callback(err)
  		callback(null, group)
  	})
  	},
  	function(callback){
	  bcrypt.genSalt(12, function(err, salt) {
		if (err) return callback(err);
		bcrypt.hash(user.password, salt, callback);
	  })
	},
	function(callback){
	   if(utils.isUserNameValid(user.username))
	   callback()
	   else callback("invalid username")
	},
	function(callback){
	   if(utils.isPasswordValid(user.password))
	   callback()
	   else callback("invalid password")
	},
    function(callback){
	   User.count({'userslug':userslug}, function(err, count){
	   	 if(count>0) callback("username taken")
	   	 callback()
	   })
	}
  ], function(err, results) { 
       if(err) return res.json(400,{info:{code:'', message:err}});
       var uid = results[0].nextUid + 1
       async.auto({
       	  createUser: function(callback){
       	  	var hashPwd = results[2]
       	  	user._key = "user:"+uid
       	  	user.uid = uid
       	  	user.userslug = userslug;
       	  	user.password = hashPwd
       	  	user.save(function(err, user){
       	  		if(err) return callback(err)
       	  		callback(null, user)
       	  	})
       	  },
       	  updateGlobal: ['createUser', function(callback){
       	  	var global = new Global(results[0])
       	  	Global.findById(global._id, function(err, global){
              global.nextUid = uid 
       	  	  global.userCount = uid
       	  	  global.save(function(err, global){
       	  	  	if(err) return callback(err)
    		    callback(null, global)
       	  	  })
            })
       	  }],
       	  updateGroup: ['createUser', function(callback){
       	  	var group = new Group(results[1])
       	  	Group.findById(group._id, function(err, group){
       	  	    group.members.push(uid+'')
       	  	    group.save(function(err, group){
                  if(err) return callback(err)
       	  		  callback(null, group)
       	  	    })
       	  	})
       	  }],
       	  updateSet1:['createUser', function(callback){
       	  	var set = new Set()
       	  	set._key = "users:joindate"
       	  	set.score = now
       	  	set.value = uid
       	  	set.save(function(err, set){
       	  		if(err) return callback(err)
       	  		callback(null, set)
       	  	})
       	  }],
       	  updateSet2:['createUser', function(callback){
       	  	var set = new Set()
       	  	set._key = "users:postcount"
       	  	set.score = 0
       	  	set.value = uid
       	  	set.save(function(err, set){
       	  		if(err) return callback(err)
       	  		callback(null, set)
       	  	})
       	  }],
       	  updateSet3:['createUser', function(callback){
       	  	var set = new Set()
       	  	set._key = "users:reputation"
       	  	set.score = 0
       	  	set.value = uid
       	  	set.save(function(err, set){
       	  		if(err) return callback(err)
       	  		callback(null, set)
       	  	})
       	  }]
       	}, function(err, results){
       		if(err) return res.json(400,{info:{code:'', message:err}});
       		return res.json(results)
       	})
     }
  )
}