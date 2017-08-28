var fs = require('fs');


function processSomething() {
	var yourVal = 5;
	fs.stat('temp.log' , function(err, stats, yourVal) {
		console.log('test.log stats. ' + yourVal);
	});
	yourVal = 7;
}

processSomething();





var links = ['http://google.com', 'http://yahoo.com'];
for (link in links) {
    var url = links[link];
    require('request')(url, function() {
        console.log(url);
    });
}

for (link in links) {
var url = links[link];

require('request')(url, function() {

    console.log(this.urlAsy);

}.bind({urlAsy:url}));
}

var request = require('request');
var links = ['http://google.com', 'http://yahoo.com'];
for (link in links) {
    (function(url) {
        request(url, function() {
            console.log(url);
        });
    })(links[link]);
}