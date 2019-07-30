var Datastore = require('nedb');
var db = new Datastore({ filename: 'biennale-db.json', autoload: true });
var newrecord = {"timestamp":1504166931274,"filename":"P1090326.JPG","status":6,"stats":{"dev":16777220,"mode":33188,"nlink":1,"uid":503,"gid":20,"rdev":0,"blksize":4096,"ino":48856169,"size":3542519,"blocks":6920,"atimeMs":1504166930000,"mtimeMs":1504016259000,"ctimeMs":1504166930000,"birthtimeMs":1504016259000,"atime":{"$$date":1504166930000},"mtime":{"$$date":1504016259000},"ctime":{"$$date":1504166930000},"birthtime":{"$$date":1504016259000}}};


var fileInterval = setInterval(processLoop, 100);


function processLoop() {
	newrecord.timestamp = Date.now();
	newrecord.filename = Date.now() + ".jpg";
	db.insert(newrecord, function (err, newDoc) {
		if (err) throw(err);
		console.log("Newrecord: " + newrecord.filename);
	});
}
