var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('../biennale.db');
var newrecord = {
	"filename": "check2.jpg",
	"status": 2
};

 
db.serialize(function() { 
  db.each("SELECT * FROM pics WHERE status=1", function(err, row) {
      console.log(row.id + ": " + row.filename + ":" + row.status);
  });
});

db.serialize(function() {
  db.run("INSERT INTO pics (filename, status) VALUES (?, ?)", newrecord.filename, newrecord.status);
});

db.serialize(function() {
  db.run("UPDATE pics SET filename = ?, status=? WHERE filename = ?", newrecord.filename, newrecord.status, newrecord.filename);
});



db.close();
