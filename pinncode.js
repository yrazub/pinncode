module.exports = {
    fetch: fetchTournaments,
    getTournaments: getTournaments,
    start: start,
    stop: stop,
    restart: restart,
    subscribe: subscribeOnTournaments,
    isStarted: isStarted,
    getModel: getModel
};

var request = require("request").defaults({jar: true}),
    fs = require('fs'),
    storage = require('node-persist'),
    Promise = require('promise'),
    path = require("path"),
    mainDir = path.dirname(require.main.filename),
    callbacks = [],
    consts = {
        baseUrl: "http://www.pinnaclesports.com",
        defaultInterval: 300,
        ignoreRemovedTournaments: true,
        defaultEmail: "ivankraynyk@hotmail.com"
    },
    config = require('./modules/config'),
    intervalId;


storage.initSync({
    dir:mainDir + "/data" ,
    // stringify: JSON.stringify,
    // parse: JSON.parse,
    encoding: 'utf8',
    logging: false,
    continuous: true,
    interval: false
});

var tournaments = storage.getItem("tournaments");
//console.log("Tournaments from storage:" + JSON.stringify(tournaments));

var email = config.get("email");
console.log("Email from storage:" + email);
if (!email) {
    config.set("email", consts.defaultEmail);    
}

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
    var difference = {}, key;
    
    if (!ignoreMissingKeys) {
        for (key in a) {
            if (!a.hasOwnProperty(key)) {
                continue;
            }
            
            if (!b[key]) {
                //console.log("======== key missing: " + key);
                
                difference[key] = {status: 0};
            }
        }
    }
    
    for (key in b) {
        if (!b.hasOwnProperty(key)) {
            continue;
        }
        
        if (!a || !a[key]) {
            //console.log("======== key added: " + key);
            
            difference[key] = {status: 1};
        }
        
        if (b[key].hndcp && a && a[key] && !a[key].hndcp) {
            //console.log("======== hndcp added: " + key);
            
            difference[key] = {hndcp: true};
        }
    }
    
    //console.log("difference:", difference);
    
    
    return difference;
}

function fetchTournaments(){
    
    function parseTournaments(body){
       var r = /<div class="clr".*?>Tennis<\/div>([\s\S]*?)<div class="clr"/gmi,
            r1 = /<a .*?href="(\/League\/Tennis\/[^\/]+\/\d+\/Lines\.aspx)".*?>\s?([\s\S]*?)\s?<\/a>/gmi,
            r_exclude = /^(?!LIVE|WTA).*/gmi;
        var groups, groups1, newTournaments;
        
        groups = r.exec(body);
        if (groups && groups[1]) {
            newTournaments = {};
            
            while (groups1 = r1.exec(groups[1])) {
                r_exclude.lastIndex = 0;
                if (groups1.length == 3 && r_exclude.test(groups1[2])) {
                    newTournaments[groups1[2]] = {status: 0, url: groups1[1]};
                }
            }
        }
        
        return newTournaments;
    }
    
    function getInfoForTournament(t, timeout){
        
        return new Promise(function(resolve, reject){
            if (t.hndcp) {
                resolve("ignored");
                return;
            }
            var url = consts.baseUrl + t.url,
                r2 = /class="linesSpread">[\+\-]?[\d\.]+[^<]*?[\d\.]+</gmi;
            timeout = timeout || 100;
            
            setTimeout(function(){
                console.log("Sending request to " + url);
                
                request.get(url, function(error, response, body){
                    if (error || response.statusCode != 200) {
                        console.log("error sending to " + t.url, ", status" + response.statusCode, ", error:" + error);
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
        //console.log("new tournaments:" +  JSON.stringify(newTournaments));
        
        var diff = compareObj(tournaments, newTournaments, consts.ignoreRemovedTournaments);
        
        storage.setItem("tournaments", newTournaments);
        storage.persist();
        
        if (!tournaments) {
            tournaments = newTournaments;
            console.log("No previous stored tournaments, ignoring");
            return;
        }
        tournaments = newTournaments;
        
        if (Object.keys(diff).length > 0) {
            //console.log("newTournaments differs, notifying listeners");
            for (var key in diff) {
                if (diff.hasOwnProperty(key) && diff[key]) {
                    if (diff[key].status) {
                        tournaments[key].status = diff[key].status;    
                    }
                }
            }
            
            notifyOnTournaments(tournaments);
        }
    }
    
    console.log(Date().toString() + "\nFetching tournaments...");
    
    request.get(consts.baseUrl,  function(error, response, body){
        if (error) {
            console.log(error);
        } else if (response.statusCode != 200) {
            console.log("Status code : " + response.statusCode);
        } else {
            //console.log("Request successful");
        }
        
        var promises = [], timeoutRequest = 0;
        
        var newTournaments = parseTournaments(body);
        
        if (typeof newTournaments != "undefined") {  
            for (var t in newTournaments) {
                if (newTournaments.hasOwnProperty(t)) {
                    
                    if (tournaments && tournaments.hasOwnProperty(t)) {
                        //copy handicap from previous
                        newTournaments[t].hndcp = tournaments[t].hndcp;
                    }
                    
                    var promise = getInfoForTournament(newTournaments[t], (++timeoutRequest) * 2000);
                    
                    promises.push(promise);
                }
            }
            
            Promise.all(promises).then(function(result){
                try {
                    //console.log("all done ", result);
                    processTournaments(newTournaments);
                } catch (e) {
                    console.log(e);
                }
            }, function(){
                console.log("rejected");
            });
            
        } else {
            console.error("Could not parse tournaments");
        }

    });
}

function start(){
    var interval = (storage.getItem("interval") || consts.defaultInterval) * 1000;
    console.log("Starting with interval " + interval);
    intervalId = setInterval(fetchTournaments, interval);
    fetchTournaments();
}

function stop(){
    console.log("stopping...");
    clearInterval(intervalId);
    intervalId = 0;
}

function restart(){
    if (isStarted()) {
        stop();
    }
    start();
}

function isStarted(){
    return !!(intervalId);
}

function getModel(){
    return { 
        baseUrl: consts.baseUrl,
        interval: Number(storage.getItem("interval") || consts.defaultInterval),
        isStarted: isStarted(),
        tournaments: tournaments,
        email: storage.getItem("email") || ""
    };
}
