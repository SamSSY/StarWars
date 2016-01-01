var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var fs = require('fs');
var app = express();
var server = http.createServer(app);
var port = 4000;

var io = require('socket.io')
			.listen(app.listen(port, function(){
				console.log('HTTP on http://localhost:4000/');
			}));

var pairingList = [];
var isBattling = false;
			
app.use(express.static(__dirname + '/src'));
			
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

// GET method route
app.get('/', function (req, res) {
  console.log("get!");
  fs.readFile('src/view/index.html', function(err, buf) {
    res.send(buf.toString());
  });
});

// data sent from the client in the type of 
// var data = {'masterUID': masterUID, 'rivalUID': rivalUId};
io.sockets.on('connection', function (socket) {
	console.log("Connect, socket on!"); 
    app.post('/pairing', function (req, res) {
            console.log(" POST: battle pairing. ");
            console.log(req.body);
            pairingList.push(req.body);
            // check pairing
            if( checkPairing() ){
                isBattling = true;
                console.log('paired');
                io.sockets.emit('pairingSuccess', req.body);
            }
            res.send('paired');
    });
    
    // req.body: {'UID': XXXXXX, 'score': 1};
    app.post('/updatescore', function (req, res) {
            console.log(" POST: update score. ");
            console.log(req.body);
            
            if( isBattling ){
                io.sockets.emit('updateScore', req.body);  
            }
            res.send('score updated');		
    });
    
});

function checkPairing(){
    var pair = pairingList[0];
    for(var i = 0; i < pairingList.length; ++i){
        if ( pair.masterUID == pairingList[i].rivalUID && pair.rivalUID == pairingList[i].masterUID){
            // clear the list 
            pairingList = [];
            return true;
        }
    }
    return false;
}