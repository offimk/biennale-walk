var eyefi = require('eyefi');

var eyefiServer = eyefi({
    uploadPath: "./pics_outgoing/",
    cards : {
        '<001856715e53>': {
            uploadKey: '<LMWGFF4H3X>'
        }
    }
}).start();

eyefiServer.on('imageReceived', function(data) {
    console.log('received an image: ' + data.filename);
});

eyefiServer.on('uploadProgress', function(progress) {
    console.log( (100*progress.received/progress.expected).toFixed(2) + '% complete');
});

