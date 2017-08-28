var fs = require('fs');
var chokidar = require('chokidar');
var im = require("imagemagick");
var Twit = require('twit');

var cfgvar = require('./config');

var filesArr = [];
const pathobject = require('path');

var fileInterval = setInterval(processLoop, 1000);
const incomingfolder = cfgvar.pics_incoming_folder;
const outgoingfolder = cfgvar.pics_outgoing_folder;
const delayBeforePost = cfgvar.delayBeforePost;
var allowedExtArr = [".jpg", ".JPG", ".png", ".PNG"];

var T = new Twit({
  consumer_key:         'fnoRJHg9qzlcGaGkFl5kdTp8s',
  consumer_secret:      'YdqMOctQCMCsk6FuhizwY1jsqCJrluMzZeFMlL7PGFyPWVqZuR',
  access_token: '854391487811002368-PDO8uAjXz3xvPAC8XwUs0N8rUhYIKDt',
  access_token_secret: 'TfFVu60Bb6ZiPohzEI9MFACCvUZUV272yKVGR5Jj9Pejq'
});

function findIDfilesArr(filename) {
  var returnVal = -1;
  for(var o = 0; o < filesArr.length; o++) {
    if (filesArr[o][0] == filename) {
      returnVal = o;
    }
  }
  return returnVal;
}

function processLoop(){
	if (filesArr.length > 0) {
		processFiles();
	}
}

function processFiles(){
    var o=0;
    for(var i = 0; i < filesArr.length; i++) {
      o = i;
      fs.stat(incomingfolder + filesArr[o] , function(err, stats) {
        console.log(Date.now()+';' + this.myFuncArrRow[0] + ';' + this.myFuncArrRow[1] + ';' 
              + this.myFuncArrRow[2] + ';' + this.myFuncArrRow[3]) + ';';
        // after Delay from config.js no modification => start function.
        if (Date.now() > (this.myFuncArrRow[2] + delayBeforePost)) {
          	console.log(Date.now() + ' is larger than ' + this.myFuncArrRow[2] + ' plus ' + delayBeforePost);
          	resizeAndPost(this.myFuncArrRow[0]);
          	console.log('File: ' + this.myFuncArrRow[0] + 'sent for resizing and posting.');
        } else {
          console.log('File: ' + this.myFuncArrRow[0] + ' still changing. Waiting.')
        }
      }.bind({myFuncArrRow:filesArr[o]}));
    }
}

function addFile(filename) {
	if (allowedExtArr.indexOf(pathobject.extname(filename)) > -1) {
		fs.stat(incomingfolder+filename , function(err, stats) {
	    	filesArr.push([filename, stats["birthtime"].getTime(), stats["mtime"].getTime(), stats["size"]]);
	    	console.log(Date.now() + ';' +filename+ ';Added;' + stats["mtime"] + ';' + stats["size"] + ';');
	  	})
	}
}

function changeFile(filename) {
	o = findIDfilesArr(filename);
	if (o > -1) {
	  fs.stat(incomingfolder+filename , function(err, stats) {
	    filesArr[o] = [filename, filesArr[o][1], stats["mtime"].getTime(), stats["size"]];
	    console.log(Date.now() + ';' +filename+ ';Changed;' + stats["mtime"] + ';' + stats["size"] + ';');
	  })
	}
}

function resizeImageForPost(filename) {
  console.log("Image " + filename + " resize starting");
  var filename_out = filename;
  fs.stat(outgoingfolder+filename_out, function(err, stat) {
	if(err == null) {
		filename_out = filename_out + Date().toISOString();
	}});
  im.resize({width: 600, strip: false, srcPath: incomingfolder+filename, dstPath: outgoingfolder+filename_out}, function(err) {
      if(err) { throw err; }
    postImage(filename_out);
  });
}

function postImage(filename) {
	console.log("Posting this image: " +filename);
	// post a tweet with media 
	var b64content = fs.readFileSync(outgoingfolder+filename, { encoding: 'base64' })

	// first we must post the media to Twitter 
	T.post('media/upload', { media_data: b64content }, function (err, data, response) {
	// now we can assign alt text to the media, for use by screen readers and 
	// other text-based presentations and interpreters 
	var mediaIdStr = data.media_id_string
	var altText = "Big Urban Walks - Edition Sao Paulo 2017"
	var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }
	console.log('Media hochgeladen');
	T.post('media/metadata/create', meta_params, function (err, data, response) {
	if (!err) {
	  // now we can reference the media and post a tweet (media will attach to the tweet) 
	  var params = { status: 'Big Urban Walks - Edition Sao Paulo 2017 #XPSP', media_ids: [mediaIdStr] }

	  T.post('statuses/update', params, function (err, data, response) {
	    console.log('Posted: ' +filename);
	    o = findIDfilesArr(filename);
	    if (o > -1) {
	    	filesArr.splice(o,1);
	    	}
	    })
	  } else { throw err;}
	})
	})
}

function resizeAndPost(filename) {
   fs.stat(outgoingfolder+filename, function(err, stat) {
	if(err == null) {
		o = findIDfilesArr(filename);
	    if (o > -1) {
	    	filesArr.splice(o,1);
	    	}
		console.log(filename+' already posted');
	} else {
		resizeImageForPost(filename);
    }});
}



// Initialize watcher. 
var watcher = chokidar.watch(incomingfolder, {
  ignored: /[\/\\]\./,
  persistent: true
});

console.log('WATCHING FOLDER ' +incomingfolder);

 
// Something to use when events are received. 
var log = console.log.bind(console);
// Add event listeners. 
watcher
  .on('add', path => addFile(pathobject.basename(path)))
  .on('change', path => changeFile(pathobject.basename(path)))
  .on('unlink', path => log(`File ${path} has been removed`));
 