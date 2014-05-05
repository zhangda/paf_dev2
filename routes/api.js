var async = require('async');
var Api = require('../models/api');

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
  for(var i=0;i<=req.params.level;i++){
    levels.push(i);
  }
  var result = [];
  async.forEach(levels, function(level,callback){
     Api.find().where('level').equals(level).select('name key parentId').exec(function(err,apis){
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
  Api.findByIdAndUpdate(req.params.id, req.body, function(err, api){
    if(err) return res.json(400,{info:{code:'',message:err.err}})
    return res.json(api)
  })
}

exports.show = function(req, res){
  Api.findOne({'key':req.params.key}, function(err,api){
    if(err) return res.json(400,{info:{code:'',message:err.err}})
    if(api == null) return res.json(400,{info:{code:'',message:'object not found'}})
    Api.find().where('parentId').equals(api._id).select('name key').exec(function(err,apis){
      if(err) return res.json(400,{info:{code:'',message:err.err}})
      api.children = apis
      return res.json(api)
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
