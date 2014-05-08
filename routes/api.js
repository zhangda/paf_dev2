var async = require('async');
var Api = require('../models/api');
  var $ = require("mongous").Mongous;

exports.create = function(req, res){
  var api = new Api(req.body);
  if(api.parentId!=="0"){
    Api.findOne({'_id':api.parentId}, function(err, parent){
      if(err) return res.json(400,{info:{code:'', message:err.err}});
      api.level = parent.level+1;
      api.save(function(err, api){
        if(err) return res.json(400,{info:{code:'',message:err.err}})
        return res.json(api)
      })
    })
  }else{
      api.save(function(err, api){
        if(err) return res.json(400,{info:{code:'',message:err.err}})
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

exports.list = function(req,res){
  var levels = [];
  for(var i=req.params.start;i<=req.params.end;i++){
    levels.push(i);
  }
  var result = [];
  async.forEach(levels, function(level,callback){
     Api.find().where('level').equals(level).exec(function(err,apis){
          if(err) return res.json(400,{info:{code:'',message:err.err}})
          var tmp = {}
          tmp.level = level
          tmp.apis = apis
          result.push(tmp)
          callback();
      });
  }, function(err){
      if(err) return res.json(400,{info:{code:'',message:err.err}});
      result.sort(function(a, b){
        if(a.level < b.level)
          return -1;
        if(a.level > b.level)
          return 1;
        return 0;
      });

    while(result.length>1){
      var tail = result.pop();
      mergeToParent(tail, result);
    }
    return res.json(result[0].apis);
  });
}

exports.update = function(req,res){
  var id = req.params.id
  var pid = req.body.targetId
  var lvl = parseInt(req.body.level)
  var plvl = parseInt(req.body.targetLevel)
  var levels = [];
  for(var i=lvl+1;i<=10;i++){
    levels.push(i);
  }
  var offspring = [];
  async.forEachSeries(levels, function(level,callback){
     // Api.find().where('level').equals(level).exec(function(err,apis){
     //      if(err) return res.json(400,{info:{code:'',message:err.err}})
     //      var tmp = {}
     //      tmp.level = level
     //      tmp.apis = apis
     //      offspring.push(tmp)
     //      callback();
     //  });
     $("paf_dev2.apis").find({'level':level}, function(apis){
          var tmp = {}
          tmp.level = level
          tmp.apis = apis.documents
          offspring.push(tmp)
          callback()
     })
  }, function(err){
    console.log(offspring)
      if(err) return res.json(400,{info:{code:'',message:err.err}});
      offspring.sort(function(a, b){
        if(a.level < b.level)
          return -1;
        if(a.level > b.level)
          return 1;
        return 0;
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
            console.log(err)
            if(err) return res.json(400,{info:{code:'',message:err}});
            else return res.json(api)
          })
      })
  })}

exports.showByKey = function(req, res){
  Api.findOne({'key':req.params.key}, function(err,api){
    if(err) return res.json(400,{info:{code:'',message:err.err}})
    if(api == null) return res.json(400,{info:{code:'',message:'object not found'}})
    Api.find().where('parentId').equals(api._id).exec(function(err,apis){
      if(err) return res.json(400,{info:{code:'',message:err.err}})
      api.children = apis
      if(api.parentId!=0){
        Api.findOne({'_id':api.parentId}, function(err, parent){
            if(err) return res.json(400,{info:{code:'',message:err.err}})
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
      if(err) return res.json(400,{info:{code:'',message:err.err}})
      api.children = apis
      if(api.parentId!=0){
        Api.findOne({'_id':api.parentId}, function(err, parent){
            if(err) return res.json(400,{info:{code:'',message:err.err}})
            api.parent = parent
            return res.json(api)
        })
      }else return res.json(api)
    })
  })
}

exports.remove = function(req,res){
  Api.count({'parentId':req.params.id}, function(err, count){
    if(err) return res.json(400,{info:{code:'',message:err.err}})
    if(count>0){
      return res.json(400,{info:{code:'',message:'it is not leaf node, delete its children first'}})
    }
    Api.findByIdAndRemove(req.params.id, function(err,api){
      if(err) return res.json(400,{info:{code:'',message:err.err}})
      return res.json(api)
    })
  })
}

function filterOutChildren(offspring, id){
  var result = []
  ids = [id]
  for(var i=0;i<offspring.length;i++){
    console.log(ids)
    var filtered = offspring[i].apis.filter(function(value, index, ar){
      if(ids.indexOf(value.parentId)>-1)
        return true
      else
        return false
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


exports.move = function(req,res){
  var id = req.params.id
  var pid = req.params.pid
  var lvl = parseInt(req.params.lvl)
  var plvl = parseInt(req.params.plvl)
  var levels = [];
  for(var i=lvl+1;i<=10;i++){
    levels.push(i);
  }
  var offspring = [];
  async.forEach(levels, function(level,callback){
     Api.find().where('level').equals(level).exec(function(err,apis){
          if(err) return res.json(400,{info:{code:'',message:err.err}})
          var tmp = {}
          tmp.level = level
          tmp.apis = apis
          offspring.push(tmp)
          callback();
      });
  }, function(err){
      if(err) return res.json(400,{info:{code:'',message:err.err}});
      offspring.sort(function(a, b){
        if(a.level < b.level)
          return -1;
        if(a.level > b.level)
          return 1;
        return 0;
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
          if(err) return res.json(400,{info:{code:'',message:err.err}})
          Api.findByIdAndUpdate(id, {level:plvl+1, parentId:pid}, function(err, api){
            if(err) return res.json(400,{info:{code:'',message:err.err}});
            else return res.json(api)
          })
      })
  })}
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
