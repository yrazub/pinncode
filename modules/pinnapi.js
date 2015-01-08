var request = require("request").defaults({jar: true}),
    config = require("./config"),
    consts = {
        tennisId: 33
    };


var options = {
    url: 'https://api.pinnaclesports.com/v1/feed?sportid=33',
    headers: {
        'Authorization': 'Basic ' + config.get("authorization")
    }
};

var api = {
    test: test
};

function test(){
    var callback = function(error, response, body){
        if (error || response.statusCode != 200) {
            console.log("error sending request, status " + response.statusCode, ", error:" + error, "body:" + body);
        } else {
            console.log(body);    
        }
    }
    
    request(options, callback);
}

module.exports = api;