module.exports = {
    fetch: fetchTournaments,
    getTournaments: getTournaments,
    start: start,
    stop: stop,
    subscribe: subscribeOnTournaments,
    isStarted: isStarted
};

var request = require("request").defaults({jar: true}),
    fs = require('fs'),
    storage = require('node-persist'),
    callbacks = [],
    consts = {
        baseUrl: "http://www.pinnaclesports.com/",
        interval: 100000
    }, intervalId;
    
storage.initSync({
    // dir:'./data',
    // stringify: JSON.stringify,
    // parse: JSON.parse,
    encoding: 'utf8',
    logging: false,
    continuous: true,
    interval: false
});

var tournaments = storage.getItem("tournaments");
console.log("Tournaments from storage:" + JSON.stringify(tournaments));

function file(data, fileName){
    if (!fileName) {
        fileName = Date().toString() + ".log";
    }
    
    fs.writeFile("./logs/" + fileName, data, function(err) {
        if(err) {
            console.log(err);
        }
    });
}

function getTournaments(){
    return tournaments;
}

function subscribeOnTournaments(callback){
    callbacks.push(callback);
}

function notifyOnTournaments(tournaments){
    for (var i=0; i<callbacks.lenght; i++) {
        try {
            callback(tournaments);
        } catch (e) {
            console.error(e)
        }
    }
}

function compareObj(a, b) {
    console.log("========compare");
    
    if (Object.keys(a).length != Object.keys(b).length) {
        
        console.log("========key count differs");
        return false;
    }
    
    for (var key in a) {
        if (!a.hasOwnProperty(key)) {
            continue;
        }
        
        if (!b[key]) {
            console.log("========no key " + key);
            return false;
        }
        
        if (b[key] !== a[key]) {
            console.log("======== key value differs: " + key + ", value=" + b[key]);
            return false;
        }
    }
    
    console.log("======== objects identical");
    
    
    return true;
}

function fetchTournaments(){
    request.get(consts.baseUrl,  function(error, response, body){
        if (error) {
            console.log(error);
        } else if (response.statusCode != 200) {
            console.log("Status code : " + response.statusCode);
        } else {
            console.log("Request successful");
        }
            
        file(body);
            
        //parsing block tournaments
        // var r = /<div class="clr".*?>Tennis<\/div>[\s\S]*?<a .*?>([\s\S]*?)<\/a>[\s\S]*?<div class="clr"/gmi
        var r = /<div class="clr".*?>Tennis<\/div>([\s\S]*?)<div class="clr"/gmi
        var block, groups, groups1;
        
        groups = r.exec(body);
        if (groups && groups[1]) {
            var r1 = /<a .*?href="\/League\/Tennis\/[^\/]+\/\d+\/Lines\.aspx".*?>\s?([\s\S]*?)\s?<\/a>/gmi;
            var newTournaments = {};
            
            while (groups1 = r1.exec(groups[1])) {
                newTournaments[groups1[1]] = 1;
            }
            
            console.log("new tournaments:" +  JSON.stringify(newTournaments));
            
            if (!compareObj(tournaments, newTournaments)) {
                console.log("newTournaments differs, notifying listeners");
                notifyOnTournaments(newTournaments);
            }
            
            tournaments = newTournaments;
            storage.setItem("tournaments", newTournaments);
            //storage.persist();
        }

    });
}

function start(){
    console.log("starting...");
    fetchTournaments();
    intervalId = setInterval(fetchTournaments, consts.interval);
}

function stop(){
    console.log("stopping...");
    clearInterval(intervalId);
    intervalId = 0;
}

function isStarted(){
    return !!(intervalId);
}