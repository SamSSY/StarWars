var tessel = require('tessel');
var rfidlib = require('rfid-pn532');
var rfid = rfidlib.use(tessel.port['A']); 
var http = require('http');

var isRegistered = false;
var readyToRegister = false;
var masterUID = null;
var rivalUId = null;
var timeId = 0;	
var masterScore = 0;
var isBattling = false;

var gpio_bank = tessel.port['GPIO'];
var pinA = gpio_bank.pin['G1'];
var pinB = gpio_bank.pin['G2'];
var pinC = gpio_bank.pin['G3'];
var pinD = gpio_bank.pin['G4'];
// set all pins as digital input
pinA.rawDirection(false);
pinB.rawDirection(false);
pinC.rawDirection(false);
pinD.rawDirection(false);
				
tessel.button.on('press', function(){
	readyToRegister = !readyToRegister;
	if (readyToRegister && !isRegistered){
		console.log("ready to register.");
		tessel.led[0].output(1);
	}
	else{
		tessel.led[0].output(0);
	}
});

rfid.on('ready', function (version) {
	console.log('Ready to read RFID card');
	rfid.on('data', function(card) {
		console.log('UID:', card.uid.toString('hex'));
  		if(readyToRegister && !isRegistered){
			console.log('registered.');
			masterUID = card.uid.toString('hex');
			console.log('master: ' + masterUID);
			isRegistered = true;
			readyToRegister = false;
			tessel.led[0].output(0);
			tessel.led[1].output(1);
		}
		else if (isRegistered){
			if(card.uid.toString('hex') !== masterUID){
				console.log('new rival!');
				rivalUId = card.uid.toString('hex');
				console.log('rival: ' + rivalUId);
				
				sendPairing();
			}
		}
	});
});

rfid.on('error', function (err) {
	console.error(err);
});

function sendPairing(){
	
	console.log('sending pairing request...');
	var options = {
        hostname: '52.10.182.239',
        port: 4000,
        path:'/pairing',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
    };
	
	var req = http.request(options, function(res) {
    	res.setEncoding('utf8');
    	res.on('data', function (chunk) {
        	console.log('Response received.');
			console.log(chunk.toString('utf8'));
            if(chunk.toString('utf8') == 'paired'){
                isBattling = true;
                startDetect();
            }
        });
        
        res.setTimeout(1000, function(){
            console.log("timeout");
            sendPairing();
        });
        
        res.on('end', function(){
			console.log('res end.');
        });	
    });
	
	var data = {'masterUID': masterUID, 'rivalUID': rivalUId};
	
	req.on('error', function(e) {
        console.log('problem with request: ', e.message);
    });
	
	console.log('Pushed data.');
    req.write(JSON.stringify(data), function(err){
    	req.end();
    });	
}

function updateScore(){
    console.log('updating score...');
	var options = {
        hostname: '52.10.182.239',
        port: 4000,
        path:'/updatescore',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
    };
    
    var req = http.request(options, function(res) {
    	res.setEncoding('utf8');
    	res.on('data', function (chunk) {
        	console.log('POST: updatescore Response received.');
			console.log(chunk.toString('utf8'));

        });
        
        res.setTimeout(1000, function(){
            console.log("timeout");
            updateScore();
        });
        
        res.on('end', function(){
			console.log('res end.');
        });	
    });
	
	var data = {'UID': rivalUID, 'score': masterScore};
	
	req.on('error', function(e) {
        console.log('problem with request: ', e.message);
    });
	
	console.log('Pushed data.');
    req.write(JSON.stringify(data), function(err){
    	req.end();
    });	
}

function startDetect(){
    setInterval(function(){
        if( !pinA.rawRead() || !pinB.rawRead() || !pinC.rawRead() || !pinD.rawRead()){
            console.log("get hit!");
        }
    }, 100);
}

