module.exports = {
    fetch: fetchTournaments,
    getTournaments: getTournaments,
    start: start,
    stop: stop,
    subscribe: subscribeOnTournaments,
    isStarted: isStarted,
    getModel: getModel
};

var request = require("request").defaults({jar: true}),
    fs = require('fs'),
    storage = require('node-persist'),
    Promise = require('promise'),
    callbacks = [],
    consts = {
        baseUrl: "http://www.pinnaclesports.com",
        interval: 600000,
        ignoreRemovedTournaments: true
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

function compareObj(a, b, ignoreMissingKeys) {
    console.log("========compare");
    var difference = {}, key;
    
    if (!ignoreMissingKeys) {
        for (key in a) {
            if (!a.hasOwnProperty(key)) {
                continue;
            }
            
            if (!b[key]) {
                console.log("======== key missing: " + key);
                
                difference[key] = {status: 0};
            }
        }
    }
    
    for (key in b) {
        if (!b.hasOwnProperty(key)) {
            continue;
        }
        
        if (!a[key]) {
            console.log("======== key added: " + key);
            
            difference[key] = {status: 1};
        }
        
        if (b[key].hndcp && a[key] && !a[key].hndcp) {
            console.log("======== hndcp added: " + key);
            
            difference[key] = {hndcp: true};
        }
    }
    
    console.log("diff:" + JSON.stringify(difference));
    
    
    return difference;
}

function fetchTournaments(){
    
    function parseTournaments(body){
       var r = /<div class="clr".*?>Tennis<\/div>([\s\S]*?)<div class="clr"/gmi,
            r1 = /<a .*?href="(\/League\/Tennis\/[^\/]+\/\d+\/Lines\.aspx)".*?>\s?([\s\S]*?)\s?<\/a>/gmi;
        var groups, groups1, tournaments;
        
        groups = r.exec(body);
        if (groups && groups[1]) {
            tournaments = {};
            
            while (groups1 = r1.exec(groups[1])) {
                if (groups1.length == 3) {
                    tournaments[groups1[2]] = {status: 0, url: groups1[1]};
                }
            }
        }
        
        return tournaments;
    }
    
    function getInfoForTournament(t, timeout){
        console.log("Creating promise for " + t.url);
        return new Promise(function(resolve, reject){
            var url = consts.baseUrl + t.url,
                r2 = /class="linesSpread">[\+\-]\d.*?\d+</gmi;
            timeout = timeout || 100;
            
            setTimeout(function(){
                console.log("Sending request to " + t.url);
                
                request.get(url, function(error, response, body){
                    console.log(response.statusCode + " for " + t.url);
                    if (error || response.statusCode != 200) {
                        console.log("error");
                        reject(error);
                    } else {
                        var hndcp = r2.exec(body);
                        t.hndcp = !!hndcp;
                        resolve("done");
                    }
                    
                });
            }, timeout);
        });    
    }
    
    function processTournaments(newTournaments){
        console.log("all done");
        console.log("new tournaments:" +  JSON.stringify(newTournaments));
        
        var diff = compareObj(tournaments, newTournaments, consts.ignoreRemovedTournaments);
        
        tournaments = newTournaments;
        storage.setItem("tournaments", newTournaments);
        storage.persist();
        
        if (Object.keys(diff).length > 0) {
            console.log("newTournaments differs, notifying listeners");
            for (var key in diff) {
                if (diff.hasOwnProperty(key) && diff[key]) {
                    if (diff[key].status) {
                        tournaments[key].status = diff[key].status;    
                    }
                }
            }
            
            // console.log("notifying new tournaments:" +  JSON.stringify(tournaments));
            
            notifyOnTournaments(tournaments);
        }
    }
    
    request.get(consts.baseUrl,  function(error, response, body){
        if (error) {
            console.log(error);
        } else if (response.statusCode != 200) {
            console.log("Status code : " + response.statusCode);
        } else {
            console.log("Request successful");
        }
        
        //remove if unnecessary    
        file(body);
        
        var promises = [], timeoutRequest = 0;
        
        var newTournaments = parseTournaments(body);
        
        if (typeof newTournaments != "undefined") {  
            for (var t in newTournaments) {
                if (newTournaments.hasOwnProperty(t)) {
                    var promise = getInfoForTournament(newTournaments[t], (++timeoutRequest) * 2000);
                    
                    promises.push(promise);
                }
            }
            
            Promise.all(promises).then(function(result){
                console.log(result);
                processTournaments(newTournaments);
            }, function(){
                console.log("rejected");
            });
            
        } else {
            console.error("Could not parse tournaments");
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

function getModel(){
    return { 
        baseUrl: consts.baseUrl,
        interval: consts.interval / 1000,
        isStarted: isStarted(),
        tournaments: tournaments
    };
}
