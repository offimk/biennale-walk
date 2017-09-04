// var im = require("imagemagick");
var gm = require('gm');
var chokidar = require('chokidar');
var Twit = require('twit');
var fs = require('fs');
var Datastore = require('nedb');
var db = new Datastore({ filename: 'biennale-db.json'});
 

const pathobject = require('path');


var cfgvar = require('./config');
 
var T = new Twit({
  consumer_key:         'fnoRJHg9qzlcGaGkFl5kdTp8s',
  consumer_secret:      'YdqMOctQCMCsk6FuhizwY1jsqCJrluMzZeFMlL7PGFyPWVqZuR',
  access_token:         '854391487811002368-PDO8uAjXz3xvPAC8XwUs0N8rUhYIKDt',
  access_token_secret:  'TfFVu60Bb6ZiPohzEI9MFACCvUZUV272yKVGR5Jj9Pejq'
});





const incomingfolder = cfgvar.pics_incoming_folder;
const outgoingfolder = cfgvar.pics_outgoing_folder;
const delayBeforePost = cfgvar.delayBeforePost;
const twitterMessage = cfgvar.twitterPost;
var internetConnected = false;
var allowedExtArr = [".jpg", ".JPG", ".png", ".PNG"];

// check internet connectivity
function checkInternet(cb) {
    //console.log("checking internet");
    require('dns').lookup('google.com',function(err) {
        if (err && err.code == "ENOTFOUND") {
            //console.log("not connected");
            internetConnected = false;
            cb(false);
        } else {
            //console.log("connected");
            internetConnected = true;
            cb(true);
        }
    })
}


// init DB
db.loadDatabase(function (err){
  if (err) throw(err);
  console.log("DB loaded");
  //special functions?
  startOptions();
  startMain();
});

function startOptions() {
  process.argv.forEach(function (val, index, array) {
    if (val == 'populate') {
      db.remove({}, { multi: true }, function (err, numRemoved) {
        fs.readdirSync(incomingfolder).forEach(file => {
          var newrecord = {"timestamp": Date.now(), "filename": file, "status": 6, "stats": {}};
          console.log("added: " + file);
          fs.stat(incomingfolder + file , function(err, stats) {
            newrecord.stats = stats;
            db.insert(newrecord);
          });
        });
      });
    }
  });  
}

function startMain () {
  console.log('Starting watching folder ' + incomingfolder);
  checkInternet(function (cb) {
      console.log("Internet is up: " + cb);
  });
  
  // startWatching();
  // if uncomment above, please comment the watchingDirLoop in main event loop
  var fileInterval = setInterval(processLoop, 1000);
}

function watchingDirLoop () {
  fs.readdirSync(incomingfolder).forEach(file => {
    db.find({ filename: file }, function (err, docs) {
      if (err) {console.log("Error")} else {
        // console.log("DOCS: " +  docs.length);
        if (docs.length > 0) {
          //console.log("File: "+ docs[0].filename);
        } else {
          addFile(file);
        }
      }
    });
  });  
}


function startWatching() {
  // Initialize watcher. 
  var watcher = chokidar.watch(incomingfolder, {
    ignored: /[\/\\]\./,
    persistent: true
  });
   
  // Something to use when events are received. 
  var log = console.log.bind(console);
  // Add event listeners. 
  watcher
    .on('add', path => addFile(pathobject.basename(path)))
    .on('change', path => console.log("File ${path} has been changed"))
    .on('unlink', path => console.log("File ${path} has been removed"));

}




function processLoop(){
  // status:
  // 0: added
  // 1: loading
  // 2: loaded
  // 3: resizing
  // 4: resized
  // 5: posting
  // 6: posted
  // 7: posting on hold
  // 9: permanent error

  // check FilesDir for new files
  watchingDirLoop();

  // check if added files have finished loading
  db.find({ $or: [{ status: 0 }, { status: 1 }] }, function (err, docs) {
    docs.forEach(function(entry) {
        fs.stat(incomingfolder + entry.filename , function(err, stats) {
          if (Date.now() > (entry.timestamp + delayBeforePost)) {
            console.log('File: ' + entry.filename + ' is stable.')
            // Set an existing field's value
            db.update({ _id: entry._id }, { $set: { "status": 2, "stats": stats } }, { multi: false }, function (err, numReplaced) {
              // numReplaced = 3
              console.log(entry.filename + " is stable");
              resizeAndPost(entry);
            });
          } else {
            if (entry.status == 0) {
              db.update({ _id: entry._id }, { $set: { "status": 1, "stats": stats } }, { multi: false }, function (err, numReplaced) {
                console.log(entry.filename + " is added and waiting for resizing");
              });
            }
          }
        });
    });
  });

  // check if internetConnected AND images on posting hold
  if (internetConnected) {
    //console.log("running db find status 7");
    db.find({ status: 7 }, function (err, docs) {
      docs.forEach(function(entry) {
        console.log("running post with " + entry.filename);
        postImage(entry);
      });
    });
  }

}



function addFile(filename) {
  if (allowedExtArr.indexOf(pathobject.extname(filename)) > 0) {
    var newrecord = {"timestamp": Date.now(), "filename": filename, "status": 0, "stats": {}};
    // console.log("add file procedure for: " + filename);
    db.findOne({ "filename": filename }, function (err, doc) {
      if (doc == null) {
        fs.stat(incomingfolder + filename , function(err, stats) {
          newrecord.stats = stats;
          db.insert(newrecord);
          console.log(filename + " added.");
        });
      }
    });
  }
}



function resizeImageForPost(resentry) {
  var filename_out = resentry.filename;
  console.log("Image " + filename_out + " resize starting");
  db.update({ _id: resentry._id }, { $set: { "status": 3 } }, { multi: false });
  
  fs.stat(outgoingfolder+filename_out, function(err, stat) {
	// in case file already exists, name new
  if(err == null) {
		filename_out = filename_out + Date.now();
    console.log("exists already");
	}});
  //im.resize({width: 600, strip: false, srcPath: incomingfolder+resentry.filename, dstPath: outgoingfolder+filename_out}, function(err) {
  gm(incomingfolder+resentry.filename).resize(600, 600).noProfile().write(outgoingfolder+filename_out, function (err) {
    if(err) {
        console.log("Error while resizing " + resentry.filename);
        // hier muss noch der Status Error Update rein
        console.log(err);
      } else {
        postImage(resentry);
        db.update({ _id: resentry._id }, { $set: { "status": 4} }, { multi: false });
      }
  });
}

function postImage(resentry) {
    db.update({ _id: resentry._id }, { $set: { "status": 5} }, { multi: false });
    console.log("Posting this image: " + resentry.filename);
    // post a tweet with media 
    var b64content = fs.readFileSync(outgoingfolder+resentry.filename, { encoding: 'base64' });
   
    // first we must post the media to Twitter 
    T.post('media/upload', { media_data: b64content }, function (err, data, response) {
      // now we can assign alt text to the media, for use by screen readers and 
      // other text-based presentations and interpreters 
      var mediaIdStr = data.media_id_string;
      var altText = twitterMessage;
      var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } };
      
      T.post('media/metadata/create', meta_params, function (err, data, response) {
        if (!err) {
          console.log('Media uploaded');
          // now we can reference the media and post a tweet (media will attach to the tweet) 
          var params = { status: twitterMessage, media_ids: [mediaIdStr] };
     
          T.post('statuses/update', params, function (err, data, response) {
            console.log('Posted: ' + resentry.filename);
            db.update({ _id: resentry._id }, { $set: { "status": 6} }, { multi: false });
            });
            internetConnected = true; console.log("Internet connection is up: " + internetConnected);
          } else {
            console.log(err);
            // put on posting hold status
            db.update({ _id: resentry._id }, { $set: { "status": 7} }, { multi: false });
            checkInternet(function(cb) { console.log("Internet connection is up: " + cb)});
          }
       });
    });
}

function resizeAndPost(filename) {

   fs.stat(outgoingfolder+filename, function(err, stat) {
	if(err == null) {
		console.log(filename+' already posted');
	} else {
		resizeImageForPost(filename);
    }});
}


function changeFile(filename) {
  o = findIDfilesArr(filename);
  if (o > -1) {
    fs.stat(incomingfolder+filename , function(err, stats) {
      filesArr[o] = [filename, filesArr[o][1], stats["mtime"].getTime(), stats["size"]];
      console.log(Date.now() + ';' +filename+ ';Changed;' + stats["mtime"] + ';' + stats["size"] + ';');
    });
  } else {console.log("GEÄNDERT ABER NICHT EINGETRAGEN!");}
}



 






  