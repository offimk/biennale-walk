  var im = require("imagemagick");

  im.resize({width: 600, strip: false, srcPath: "test.jpg", dstPath: "testout.jpg"}, function(err) {
      if(err) { console.log("Error while resizing " + resentry.filename)}//throw err; }
    //postImage(resentry);
    //db.update({ _id: resentry._id }, { $set: { "status": 4} }, { multi: false });
  });