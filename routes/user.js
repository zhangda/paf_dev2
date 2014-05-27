var async = require('async');
var User = require('../models/user');
var crypto = require('crypto');

function md5 (text) {
  return crypto.createHash('md5').update(text).digest('hex');
};

exports.login = function(req, res){
  var user = req.body
  User.findOne({'username':user.username, 'password':md5(user.password)}, function(err, user){
     if(err) return res.json(400,{info:{code:'',message:err}})
     if(user == null ) return res.json(400,{info:{code:'',message:'username or password wrong'}})
     if(Date.now() - new Date(user.updatetime).getTime() > 1000*3600){
        user.updatetime = Date.now()
        crypto.randomBytes(16,  function(ex, buf){
          user.token = buf.toString('hex'); 
          user.save(function(err, user){
          if(err) return res.json(400,{info:{code:'',message:err}})
          return res.json(user)
         })
        })  
     }else{
        return res.json(user)
     }
  })
}

exports.create = function(req, res){
  var user = new User(req.body)
  user.password = md5(user.password)
  crypto.randomBytes(16,  function(ex, buf){
    user.token = buf.toString('hex'); 
    user.save(function(err, user){
        if(err) return res.json(400,{info:{code:'',message:err}})
        return res.json(user)
    })
  })
}

exports.password = function(req, res){
  User.findOne({'username':req.body.username, 'password':md5(req.body.password)}, function(err, user){
    if(err) return res.json(400,{info:{code:'',message:err}})
    if(user == null ) return res.json(400,{info:{code:'',message:'username or password wrong'}})
    user.password = md5(req.body.newPassword)
    user.save(function(err, user){
        if(err) return res.json(400,{info:{code:'',message:err}})
        return res.json(user)
    })
  })
}

// var async = require('async');
// var bcrypt = require('bcryptjs');
// var utils = require('./utils');

// var $ = require("mongous").Mongous;

// exports.list = function(req,res){
//   $("nodebb.objects").find({_key:{$regex:/^user:.*/}},function(users){
//     return res.json(users.documents)
// });
// }

// exports.create = function(req, res){
//   var user = req.body
//   var now = Date.now()
//   user.lastonline = now
//   user.joindate = now
//   var userslug = utils.slugify(user.username);
//   async.parallel([
//     function(callback){
//       $("nodebb.objects").find({_key:'global'},function(global){
//         callback(null, global.documents[0])
//       })
//     },
//     function(callback){
//       $("nodebb.objects").find({_key:'group:registered-users:members'}, function(group){
//          callback(null, group.documents[0])
//       })
//     },
//     function(callback){
//       bcrypt.genSalt(12, function(err, salt) {
//       if (err) return callback(err);
//       bcrypt.hash(user.password, salt, callback);
//       })
//     },
//     function(callback){
//      if(utils.isUserNameValid(user.username))
//      callback()
//      else callback("invalid username")
//     },
//     function(callback){
//      if(utils.isPasswordValid(user.password))
//      callback()
//      else callback("invalid password")
//     },
//     function(callback){
//      $("nodebb.objects").find({'userslug':userslug}, function(users){
//        if(users.documents.length>0) callback("username taken")
//        else callback()
//      })
//     }
//   ],function(err, results){
//       if(err) return res.json(400,{info:{code:'', message:err}});
//       var uid = results[0].nextUid + 1
//       async.auto({
//           createUser: function(callback){
//             var hashPwd = results[2]
//             user._key = "user:"+uid
//             user.uid = uid
//             user.userslug = userslug
//             user.password = hashPwd
//             user.banned = 0
//             user.birthday=""
//             user.email = ""
//             user.fullname = ""
//             user.gravatarpicture="https://secure.gravatar.com/avatar/d10ca8d11301c2f4993ac2279ce4b930?size=128&default=identicon&rating=pg"
//             user.lastposttime = 0
//             user.location = 0
//             user.picture="https://secure.gravatar.com/avatar/d10ca8d11301c2f4993ac2279ce4b930?size=128&default=identicon&rating=pg"
//             user.postcount=0
//             user.profileviews=0
//             user.reputation=0
//             user.signature=""
//             user.status="online"
//             user.uploadedpicture=""
//             user.website=""
//             $("nodebb.objects").save(user)
//             callback(null, user)
//           },
//           updateGlobal: ['createUser', function(callback){
//             var global = results[0]
//             global.nextUid = uid 
//             global.userCount = uid
//             $("nodebb.objects").update({_id:global._id}, global)
//             callback(null, global)
//           }],
//           updateSet1:['createUser', function(callback){
//             var set = {}
//             set._key = "users:joindate"
//             set.score = now
//             set.value = uid
//             $("nodebb.objects").save(set)
//             callback(null, set)
//           }],
//           updateSet2:['createUser', function(callback){
//             var set = {}
//             set._key = "users:postcount"
//             set.score = 0
//             set.value = uid
//             $("nodebb.objects").save(set)
//             callback(null, set)
//           }],
//           updateSet3:['createUser', function(callback){
//             var set = {}
//             set._key = "users:reputation"
//             set.score = 0
//             set.value = uid
//             $("nodebb.objects").save(set)
//             callback(null, set)
//           }],
//           updateMap1:['createUser', function(callback){
//             $("nodebb.objects").find({_key:'username:uid'}, function(map){
//               var mapping = map.documents[0]
//               mapping[user.username] = uid
//               $("nodebb.objects").update({_id:mapping._id}, mapping)
//               callback(null, mapping)
//             })
//           }],
//           updateMap2:['createUser', function(callback){
//             $("nodebb.objects").find({_key:'userslug:uid'}, function(map){
//               var mapping = map.documents[0]
//               mapping[user.userslug] = uid
//               $("nodebb.objects").update({_id:mapping._id}, mapping)
//               callback(null, mapping)
//             })
//           }],
//       },function(err, results){
//           if(err) return res.json(400,{info:{code:'', message:err}});
//           return res.json(results)
//       })
//     }
//   )
// }
