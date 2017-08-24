var path = require('path');
var http = require('http');
var MongoClient = require('mongodb').MongoClient;
var db_biennale;



//const MONGOLAB_URI='mongodb://heroku_04kmpl37:heroku_04kmpl37@ds157723.mlab.com:57723/heroku_04kmpl37?authMode=scram-sha1'
const MONGOLAB_URI='mongodb://heroku_04kmpl37:6rltu18mikr322fmd4ctm9doi0@ds157723.mlab.com:57723/heroku_04kmpl37?authMode=scram-sha1'
//MONGOLAB_URI='mongodb://example:example@ds053312.mongolab.com:53312/todolist'
// 'mongodb://example:example@ds053312.mongolab.com:53312/todolist'


MongoClient.connect(MONGOLAB_URI, function(err, db) {
  if (err) throw err;
   db_biennale = db;
   db.collection("plannedroute").find({}).toArray(function(err, result) {
    if (err) throw err;
    console.log(result);
  });
});



process.on('exit', function () {
  db_biennale.close();
  console.log('About to exit.');
});


console.log('Running');