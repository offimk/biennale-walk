var im = require("imagemagick");
var file = "test.jpg";
var fileout = "testout.jpg";

  im.resize({width: 600, strip: false, srcPath: file, dstPath: fileout}, function(err) {
      if(err) { throw err; }
    //postImage(resentry);
    //db.update({ _id: resentry._id }, { $set: { "status": 4} }, { multi: false });
  });