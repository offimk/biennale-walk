var fs = require('fs');
var chokidar = require('chokidar');


var cfgvar = require('./config');

var filesArr = [];
const pathobject = require('path');

var fileInterval = setInterval(processLoop, 1000);
const incomingfolder = cfgvar.pics_incoming_folder;
const outgoingfolder = cfgvar.pics_outgoing_folder;
const delayBeforePost = cfgvar.delayBeforePost;
var allowedExtArr = [".jpg", ".JPG", ".png", ".PNG"];


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
      fs.stat(incomingfolder + filesArr[o][0] , function(err, stats) {
        console.log(Date.now()+';' + this.myFuncArrRow[0] + ';' + this.myFuncArrRow[1] + ';' 
              + this.myFuncArrRow[2] + ';' + this.myFuncArrRow[3]) + ';';
        // after Delay from config.js no modification => start function.
        if (Date.now() > (this.myFuncArrRow[2] + delayBeforePost)) {
          console.log('File: ' + this.myFuncArrRow[0] + ' is stable.')
        } else {
          console.log('File: ' + this.myFuncArrRow[0] + ' changing.')
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
	} else {console.log("GEÄNDERT ABER NICHT EINGETRAGEN!")}
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
 