module.exports = {
   applyRoutes: function(app){
            var self = this;
            
            app.get('/logger/enable', function(req, res) {
                enable();
                res.send("ok");  
            });

            app.get('/logger/disable', function(req, res) {
                disable();
                res.send("ok");  
            });

            app.get('/logger/clear', function(req, res) {
                clear();
                res.send("ok");  
            });
    },
    
    enable: enable,
    
    disable: disable
};

var fs = require('fs'),
    util = require('util'),
    path = require("path"),
    mainDir = path.dirname(require.main.filename),
    logFilePath = mainDir + '/logs/console.log',
    logFileStream,
    enabled = false,
    originalConsoleLog;

function enable(){
    if (enabled) {
        return;
    }
    
    logFileStream = fs.createWriteStream(logFilePath, {flags : 'a'});

    console.log = function(_original){
        originalConsoleLog = _original;
        logFileStream.write("\n\n");
        return function(d) { //
            try {
                logFileStream.write(util.format.apply(null, arguments) + '\n');
            } catch(e){}
          
            _original.apply(console, arguments);
        };
    }(console.log);
    enabled = true;
};

function disable(){
    if (!enabled) {
        return;
    }
    
    logFileStream.end();
    logFileStream = null;
    
    console.log = originalConsoleLog;
    enabled = false;
}

function clear(){
    if (fs.existsSync(logFilePath)) {
        fs.unlinkSync(logFilePath);
    }
}