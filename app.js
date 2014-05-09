
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var api = require('./routes/api');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/paf_dev2')
var db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
   console.log('yay!')
  });

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

function auth(req, res, next){
  var auth_header = req.headers['authorization']
  if(auth_header==='HiU4GlEb8SVQVJtre58416bY1F234Ev2')
    next()
  else
    res.json(401,{info:{code:'',message:'unauthorized'}})
}

app.get('/', routes.index)

app.get('/apis/:start/:end', api.list)
app.post('/api', api.create)
app.put('/api/:id', api.update)
app.get('/api/key/:key', api.showByKey)
app.get('/api/id/:id', api.showById)
app.del('/api/:id', api.remove)
//app.get('/api/query', api.query)

app.get('/users', user.list)
app.post('/user', user.create)

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
