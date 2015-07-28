var
    //==========DEPENDENCIES============//
    
    config = require('./config'),
    api = require("./pinnapi"),

    
    //==========PUBLIC SECTION============//

    pinnbets = {
        getAll: function(){
            return bets;  
        },
        
        addNew: function(data){
            var id = String(Date.now());
            
            bets[id] = data;
            
            console.log(bets);
            
            config.set('bets', bets);
            notify();
        },

        remove: function (id) {
            delete bets[id];
            config.set('bets', bets);
            notify();
        },
        
        applyRoutes: function(app){
            var self = this;
            
            app.get('/bets/get', function(req, res) {
                res.send(self.getAll());
            });

            app.post('/bets/add', function(req, res) {
                console.log(req.body);
                
                self.addNew(req.body);
                res.send("ok");
            });

            app.get('/bets/remove/:id', function(req, res) {
                self.remove(req.params.id);
                res.send("ok");
            });
        }
    },
    
//==========PRIVATE SECTION============//

    bets = config.get('bets') || {},
    started = false,
    intervalId,
    settings = {
        timeout: 5
    };



function notify(){
    if (!started && Object.keys(bets).length) {
        start();
    }
    
    if (started && !Object.keys(bets).length) {
        stop();
    }
}

function start(){
    console.log("start");
    intervalId = setInterval(check, settings.timeout * 1000);
    started = true;
}

function stop(){
    console.log("stop");
    if (intervalId) {
        clearInterval(intervalId);
    }
    started = false;
}

function check() {
    console.log("checkin...");
    
    
    
}

module.exports = pinnbets;

notify();