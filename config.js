var storage = require('node-persist'),
    config = {},
    path = require("path"),
    mainDir = path.dirname(require.main.filename),
    defaults = {};
    
    
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
    
    set: function(name, value){
        storage.setItem(name, value);
    }
    
};