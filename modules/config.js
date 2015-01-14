var storage = require('node-persist'),
    config = {},
    path = require("path"),
    mainDir = path.dirname(require.main.filename),
    defaults = {
        email: 'ivankraynyk@hotmail.com',
        interval: 300
    };
    
    
storage.initSync({
    dir: mainDir + "/data" ,
    // stringify: JSON.stringify,
    // parse: JSON.parse,
    encoding: 'utf8',
    logging: false,
    continuous: true,
    interval: false
});
    
module.exports = {
    get: function(name) {
        return storage.getItem(name) || defaults[name];
    },
    
    set: function(name, value) {
        storage.setItem(name, value);
    },
    
    applyRoutes: function(app) {
        var self = this;
        
        app.get('/config/get/:name', function(req, res) {
            res.send(self.get(req.params.name));        
        });        
        
        app.get('/config/set/:name/:value', function(req, res) {
            self.set(req.params.name, req.params.value);
            res.send("ok");        
        });
    }
    
};