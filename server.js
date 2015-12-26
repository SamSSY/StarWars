var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var fs = require('fs');
var app = express();
var server = http.createServer(app);
var port = 8080;

var io = require('socket.io')
			.listen(app.listen(port, function(){
				console.log('HTTP on http://localhost:8080/');
			}));
			
app.use(express.static(__dirname + '/src'));
			
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 


// GET method route
app.get('/starwars', function (req, res) {
  console.log("get!");
  fs.readFile('src/view/index.html', function(err, buf) {
    res.send(buf.toString());
  });
});

io.sockets.on('connection', function (socket) {
	console.log("Connect, socket on!");
	app.post('/starwars/pairing', function (req, res) {
		console.log("post, battle pairing");
		console.log(req.body);
		
	});
});