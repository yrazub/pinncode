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
        interval: 15000
    },
    intervalId;

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
    for (var i=0; i<callbacks.length; i++) {
        try {
            callbacks[i](tournaments);
        } catch (e) {
            console.error(e)
        }
    }
}

function compareObj(a, b) {
    console.log("========compare");
    var difference = {}, key;
    
    for (key in a) {
        if (!a.hasOwnProperty(key)) {
            continue;
        }
        
        if (!b[key]) {
            console.log("======== key missing: " + key);
            
            difference[key] = false;
        }
    }
    
    for (key in b) {
        if (!b.hasOwnProperty(key)) {
            continue;
        }
        
        if (!a[key]) {
            console.log("======== key added: " + key);
            
            difference[key] = true;
        }
    }
    
    console.log("diff:" + JSON.stringify(difference));
    
    
    return difference;
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
        var block, groups, groups1, key;
        
        groups = r.exec(body);
        if (groups && groups[1]) {
            var r1 = /<a .*?href="\/League\/Tennis\/[^\/]+\/\d+\/Lines\.aspx".*?>\s?([\s\S]*?)\s?<\/a>/gmi;
            var newTournaments = {};
            
            while (groups1 = r1.exec(groups[1])) {
                newTournaments[groups1[1]] = {status: 0};
            }
            
            var diff = compareObj(tournaments, newTournaments);
            
            tournaments = newTournaments;
            storage.setItem("tournaments", newTournaments);
            storage.persist();
            
            if (Object.keys(diff).length > 0) {
                console.log("newTournaments differs, notifying listeners");
                for (key in diff) {
                    if (diff.hasOwnProperty(key) && diff[key]) {
                        tournaments[key].status = 1;    
                    }
                }
                
                console.log("notifying new tournaments:" +  JSON.stringify(tournaments));
                
                notifyOnTournaments(tournaments);
            }
            
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
