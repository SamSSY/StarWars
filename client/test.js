var tessel = require('tessel');
var gpio_bank = tessel.port['GPIO'];
var pinA = gpio_bank.pin['G1'];
var pinB = gpio_bank.pin['G2'];
var pinC = gpio_bank.pin['G3'];
var pinD = gpio_bank.pin['G4'];
var pinE = tessel.port['C'].pin['G2'];

// set all pins as digital input
pinA.rawDirection(false);
pinB.rawDirection(false);
pinC.rawDirection(false);
pinD.rawDirection(false);
pinE.rawDirection(false);

function detect(){
    if( !pinA.rawRead() || !pinB.rawRead() || !pinC.rawRead() || !pinD.rawRead()|| !pinE.rawRead()){
        console.log("get hit!");
    }
}

function startDetect(){
    setInterval(function(){
        detect();
    }, 30);    
};

startDetect();