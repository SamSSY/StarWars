var tessel = require('tessel');
var rfidlib = require('rfid-pn532');
var rfid = rfidlib.use(tessel.port['A']); 
var wifi = require('wifi-cc3000');
var http = require('http');

var isRegistered = false;
var readyToRegister = false;
var masterUID = null;
var rivalUID = null;
var timeId = 0;	
var masterScore = 0;
var rivalScore = 0;

// boolean value
var isBattling = false;
var isWifiConnected = false;

var gpio_bank = tessel.port['GPIO'];
var pinA = tessel.port['C'].pin['G2']; //gpio_bank.pin['G1'];
var pinB = tessel.port['C'].pin['G3']; //gpio_bank.pin['G2'];
var pinC = gpio_bank.pin['G3'];
var pinD = gpio_bank.pin['G4'];
var analogPinA1 = gpio_bank.pin['A1'];

// set all pins as digital input
pinA.rawDirection(false);
pinB.rawDirection(false);
pinC.rawDirection(false);
pinD.rawDirection(false);
				
/* wifi configuration */

var network = 'ntupeep';
var pass = 'zzzzzzzz';
var security = 'wpa2';
var timeouts = 0;

wifi.on('connect', function(data){
  // you're connected
  console.log("connect emitted", data);
  isWifiConnected = true;
});

wifi.on('disconnect', function(data){
  // wifi dropped, probably want to call connect() again
  console.log("disconnect emitted", data);
  isWifiConnected = true;
});

wifi.on('timeout', function(err){
  // tried to connect but couldn't, retry
  console.log("timeout emitted");
  timeouts++;
  if (timeouts > 2) {
    // reset the wifi chip if we've timed out too many times
    powerCycle();
  } else {
    // try to reconnect
    connect();
  }
});

wifi.on('error', function(err){
  // one of the following happened
  // 1. tried to disconnect while not connected
  // 2. tried to disconnect while in the middle of trying to connect
  // 3. tried to initialize a connection without first waiting for a timeout or a disconnect
  console.log("error emitted", err);
});

// reset the wifi chip progammatically
function powerCycle(){
  // when the wifi chip resets, it will automatically try to reconnect
  // to the last saved network
  wifi.reset(function(){
    timeouts = 0; // reset timeouts
    console.log("done power cycling");
    // give it some time to auto reconnect
    setTimeout(function(){
      if (!wifi.isConnected()) {
        // try to reconnect
        connect();
      }
      }, 20 *1000); // 20 second wait
  })
}

function connect(){
  wifi.connect({
  security: security
  , ssid: network
  , password: pass
  , timeout: 15 // in seconds
  });
}

// connect wifi now, if not already connected
if (!wifi.isConnected()) {
  connect();
}

/* end of wifi configuration */

function printScoreOnSevenSegDisplay( value ){
    switch(value){
      case 0:
        analogPinA1.write(0);
        break;
      case 1:
        analogPinA1.write(0.07);
        break;
      case 2:
        analogPinA1.write(0.13);
        break;
      case 3:
        analogPinA1.write(0.18);
        break;
      case 'none':
        analogPinA1.write(0.82);
        break;
      case 4:
        analogPinA1.write(0.24);
        break;
      case 5:
        analogPinA1.write(0.29);
        break;
      case 6:
        analogPinA1.write(0.34);
        break;
      case 7:
        analogPinA1.write(0.395);
        break;
      case 8:
        analogPinA1.write(0.43);
        break;
      case 9:
        analogPinA1.write(0.49);
        break;
      default:
        break;
    }
}

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
				rivalUID = card.uid.toString('hex');
				console.log('rival: ' + rivalUID);
				
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
                //rivalScore += 1;
                updateScore();              
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
	
	var data = {'masterUID': masterUID, 'rivalUID': rivalUID};
	
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
    printScoreOnSevenSegDisplay(rivalScore);
    
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
        
        res.setTimeout(2000, function(){
            console.log("timeout");
            updateScore();
        });
        
        res.on('end', function(){
			console.log('res end.');
        });	
    });
	
	var data = {'UID': rivalUID, 'score': rivalScore};
	
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
            updateScore();
        }
    }, 100);
}

