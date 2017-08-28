var fs = require('fs');
 
var delInterval = setInterval(del(), 1000);


function del(){
    fs.open(filePath, 'r+', function(err, fd){
        if (err && err.code === 'EBUSY'){
            console.log(filePath
        } else if (err && err.code === 'ENOENT'){
            console.log(filePath, 'deleted');
            clearInterval(delInterval);
        } else {
            fs.close(fd, function(){
                fs.unlink(filePath, function(err){
                    if(err){
                    } else {
                    console.log(filePath, 'deleted');
                    clearInterval(delInterval);
                    }
                });
            });
        }
    });
}