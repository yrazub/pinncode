var request = require("request").defaults({jar: true}),
    config = require("./config"),
    consts = {
        tennisId: 33
    };

var api = {
    test: test,
    
    getLeagues: getLeagues
};

function test() {
    var options = {
        url: 'https://api.pinnaclesports.com/v1/feed?sportid=' + consts.tennisId + '&oddsFormat=1&last=1373383152874',
        headers: {
            'Authorization': 'Basic ' + config.get("authorization")
        }
    },
    
    callback = function(error, response, body){
        if (error || response.statusCode != 200) {
            console.log("error sending request, status " + response.statusCode, ", error:" + error, "body:" + body);
        } else {
            console.log(body);
            //config.set('test.xml', body);
        }
    }
    
    request(options, callback);
}

function getLeagues() {
    var callback = function(error, response, body){
        if (error || response.statusCode != 200) {
            console.log("error sending request, status " + response.statusCode, ", error:" + error, "body:" + body);
        } else {
            console.log(body);
            //config.set('test.xml', body);
        }
    },
    
    options = {
        url: 'https://api.pinnaclesports.com/v1/leagues?sportid=' + consts.tennisId,
        headers: {
            'Authorization': 'Basic ' + config.get("authorization")
        }    
    };
    
    request(options, callback);
}

module.exports = api;