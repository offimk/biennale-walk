var im = require("imagemagick");
var chokidar = require('chokidar');
var Twit = require('twit');
var fs = require('fs');

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
console.log('Starting watching folder ' +incomingfolder);



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
        })
      } else { throw err;}
    })
  })
}

function resizeAndPost(filename) {

   fs.stat(outgoingfolder+filename, function(err, stat) {
	if(err == null) {
		console.log(filename+' already posted');
	} else {
		resizeImageForPost(filename);
    }});
}




// Initialize watcher. 
var watcher = chokidar.watch(incomingfolder, {
  ignored: /[\/\\]\./,
  ignoreInitial: true,
  persistent: true
});
 
// Something to use when events are received. 
var log = console.log.bind(console);
// Add event listeners. 
watcher
  .on('add', function(err, path){console.log(path);});






  