var
    config = require('./config'),
    bets = config.get('bets') || {},

    pinnbets = {
        getAll: function(){
            return bets;  
        },
        
        addNew: function(data){
            var id = String(Date.now());
            
            bets[id] = data;
            
            console.log(bets);
            
            config.set('bets', bets);
        },

        remove: function (id) {
            delete bets[id];
            config.set('bets', bets);
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
    };

module.exports = pinnbets;