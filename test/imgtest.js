var fs = require('fs')
  , gm = require('gm');
 
// resize and remove EXIF profile data 
gm('test.jpg')
.resize(240, 240)
.noProfile()
.write('test_resized.jpg', function (err) {
  if (err) throw(err);
});
 
 
// output all available image properties 
gm('test.jpg')
.identify(function (err, data) {
  if (err) throw(err);
});
 
