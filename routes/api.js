var async = require('async');
var Api = require('../models/api');

exports.create = function(req, res){
  var api = new Api(req.body);
  if(api.parentId!=="0"){
    Api.findOne({'_id':api.parentId}, function(err, parent){
      if(err) return res.json(400,{info:{code:'', message:err}});
      api.level = parent.level + 1;
      api.save(function(err, api){
        if(err) return res.json(400,{info:{code:'',message:err}})
        return res.json(api)
      })
    })
  }else{
      api.save(function(err, api){
        if(err) return res.json(400,{info:{code:'',message:err}})
        return res.json(api)
      })
  }
}

function mergeToParent(tail, result){
   for(var i=0; i<tail.apis.length;i++){
    for(var j=0; j<result[result.length-1].apis.length;j++){
        if(tail.apis[i].parentId == result[result.length-1].apis[j]._id){
          if(typeof result[result.length-1].apis[j].children  === "undefined"){
            result[result.length-1].apis[j].children = []
          }
          result[result.length-1].apis[j].children.push(tail.apis[i])
          break;
        }
    }
   }
}

function findSubTree(levels, callback){
  console.log(levels)
  var result = [];
  async.forEach(levels, function(level,callback){
     Api.find().where('level').equals(level).exec(function(err,apis){
          if(err) return callback(err)
          var tmp = {}
          tmp.level = level
          tmp.apis = apis
          result.push(tmp)
          callback();
      });
  }, function(err){
      if(err) return err
      result.sort(function(a, b){
        return a.level - b.level;
      });

    while(result.length>1){
      var tail = result.pop();
      mergeToParent(tail, result);
    }
    callback(result[0].apis)
  });
}

exports.list = function(req,res){
  var levels = [];
  for(var i=parseInt(req.params.start);i<=req.params.end;i++){
    levels.push(i);
  }
  findSubTree(levels, function(result){
    return res.json(result)
  })
}

exports.sibling = function(req, res){
  Api.findOne({_id:req.params.id}, function(err, curr) {
    if(err) return res.json(400,{info:{code:'',message:err}})
    Api.findOne({_id:curr.parentId}, function(err, parent){
       if(err) return res.json(400,{info:{code:'',message:err}})
        Api.find({parentId:parent._id}, function(err, siblings){
           if(err) return res.json(400,{info:{code:'',message:err}})
          var levels = [];
          for(var i=parent.level+1; i<=parent.level+2;i++){
            levels.push(i);
          }
          findSubTree(levels, function(result){
            var filtered = result.filter(function(value, index, ar){
            for(var i=0;i<siblings.length;i++){
                if(siblings[i].key == value.key) {
                  return true
                }
              }
              return false;
            })
            return res.json(filtered);
            })
        })
    })
  })
}

function filterOutChildren(offspring, id){
  var result = []
  ids = [id]
  for(var i=0;i<offspring.length;i++){
    var filtered = offspring[i].apis.filter(function(value, index, ar){
      return ids.indexOf(value.parentId)>-1
    })
    result.push(filtered)
    ids = []
    for(var j=0;j<filtered.length;j++){
      ids.push(filtered[j]._id+"")
    }
  }
  merged = []
  return merged.concat.apply(merged, result);
}


exports.update = function(req,res){
  var id = req.params.id
  var pid = req.body.targetId
  var lvl = 0
  var plvl = -1
  var levels = [];

  async.parallel([
    function(callback) {
      Api.findOne({_id:id}, function(err, curr){
         if(err){
          callback(err)
         }else{
          lvl = parseInt(curr.level)
          callback()
         }
      })
    },
    function(callback) {
      if(pid!="0"){
      Api.findOne({_id:pid}, function(err, parent){
         if(err){
          callback(err)
         }else{
          plvl = parseInt(parent.level)
          callback()
         }
      })
     }else callback()
    }
    ], function(err, result){
       if(err) return res.json(400,{info:{code:'',message:err}})

        for(var i=lvl+1;i<=5;i++){
          levels.push(i);
        }
        var offspring = [];
        async.forEach(levels, function(level,callback){
           Api.find().where('level').equals(level).exec(function(err,apis){
                if(err) return res.json(400,{info:{code:'',message:err}})
                var tmp = {}
                tmp.level = level
                tmp.apis = apis
                offspring.push(tmp)
                callback();
            })
        }, function(err){
            if(err) return res.json(400,{info:{code:'',message:err}});
            offspring.sort(function(a, b){
              return a.level - b.level
            });
            var children = filterOutChildren(offspring, id)
            var offset = plvl + 1 - lvl
            async.forEach(children, function(child, callback){
              var newlvl = child.level + offset
              Api.findByIdAndUpdate(child._id, {level:newlvl}, function(err, api){
                if(err) callback(err)
                else callback(null, api)
               })
            },function(err){
                var api = req.body
                api.level = plvl+1
                api.parentId = pid
                Api.findByIdAndUpdate(id, api, function(err, api){
                  if(err) return res.json(400,{info:{code:'',message:err}});
                  else return res.json(api)
                })
            })
        })
    })
}

exports.showByKey = function(req, res){
  Api.findOne({'key':req.params.key}, function(err,api){
    if(err) return res.json(400,{info:{code:'',message:err.err}})
    if(api == null) return res.json(400,{info:{code:'',message:'object not found'}})
    Api.find().where('parentId').equals(api._id).exec(function(err,apis){
      if(err) return res.json(400,{info:{code:'',message:err}})
      api.children = apis
      if(api.parentId!=0){
        Api.findOne({'_id':api.parentId}, function(err, parent){
            if(err) return res.json(400,{info:{code:'',message:err}})
            api.parent = parent
            return res.json(api)
        })
      }else return res.json(api)
    })
  })
}

exports.showById = function(req, res){
  Api.findOne({'_id':req.params.id}, function(err,api){
    if(err) return res.json(400,{info:{code:'',message:err.err}})
    if(api == null) return res.json(400,{info:{code:'',message:'object not found'}})
    Api.find().where('parentId').equals(api._id).exec(function(err,apis){
      if(err) return res.json(400,{info:{code:'',message:err}})
      api.children = apis
      if(api.parentId!=0){
        Api.findOne({'_id':api.parentId}, function(err, parent){
            if(err) return res.json(400,{info:{code:'',message:err}})
            api.parent = parent
            return res.json(api)
        })
      }else return res.json(api)
    })
  })
}

exports.remove = function(req,res){
  Api.count({'parentId':req.params.id}, function(err, count){
    if(err) return res.json(400,{info:{code:'',message:err}})
    if(count>0){
      return res.json(400,{info:{code:'',message:'it is not leaf node, delete its children first'}})
    }
    Api.findByIdAndRemove(req.params.id, function(err,api){
      if(err) return res.json(400,{info:{code:'',message:err}})
      return res.json(api)
    })
  })
}

/*
exports.query = function(req, res){
  var queryString = []
  for(var i in req.query){
    var item ={};
    item[i] =req.query[i];
    queryString.push(item);
  }
  Api.find({$or:queryString}, function(err, apis){
    if(err) return res.json(400,{info:{code:'',message:err.err}})
    return res.json(apis)
  })  
}
*/
