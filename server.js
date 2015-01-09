var http = require('http');
var path = require('path');
var express = require('express');
var url = require('url');
var nodemailer = require('nodemailer');
var storage = require('node-persist');
var config = require('./modules/config');
var transport = nodemailer.createTransport("SMTP", {
    service: "Gmail",
    auth: {
        user: config.get('email.from'),
        pass: config.get('email.from.password')
    }
});
var pinncode = require("./pinncode");
var ejs = require('ejs'),
    fs = require('fs'),
    emailTemplate = fs.readFileSync(__dirname + '/email.ejs', 'utf8');

var app = express();
app.use(express.basicAuth("pinncode", "p1NNcode1"));

/*==========================ROUTES==========================*/

app.get('/', function(req, res){
    console.log("default route call");
    var model= pinncode.getModel();
    if (typeof lastError != "undefined" && lastError) {
        model.lastError = lastError;
    }
    res.render("client/index.html", model);
});

app.get('/send', function(req, res){
    var email = url.parse(req.url, true).query.email;
    sendEmail(email);
    storage.setItem("email", email)
    
    res.redirect("/");
});

app.get('/save', function(req, res){
    function saveValue(name) {
        var value = url.parse(req.url, true).query[name];
        if(value) {
            storage.setItem(name, value);
            
            console.log("Changing value of " + name + " to " + value);
            
            if (name == "interval" && pinncode.isStarted()) {
                pinncode.restart();
            }
        }
    }
    
    saveValue("email");
    saveValue("interval");
    
    res.redirect("/");
});

app.get('/start', function(req, res){
    pinncode.start();
    res.send(200);
});

app.get('/stop', function(req, res){
    pinncode.stop();
    res.send(200);
});

app.get('/check', function(req, res){
    pinncode.fetch();
    res.send(200);
});

app.get('/models/:name', function(req, res){
    var name = req.params.name,
        models = {
            'pinncode': function(){
                return pinncode.getModel();
            }
        };
    
    if (name in models) {
        res.send(models[name]());
        res.send(200);
    } else {
        res.send(404);
    }
        
});

app.use(express.static(path.resolve(__dirname, 'client')));
app.use(express.static(path.resolve(__dirname, 'data')));
app.use(express.static(path.resolve(__dirname, 'logs')));

app.engine('.html', ejs.__express);
app.set('views', __dirname);

config.applyRoutes(app);

/*==========================SERVER==========================*/

var server_port = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3000;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || process.env.IP || "0.0.0.0";

console.log("\n\n");
console.log("==================================================================");
console.log("= Starting server at ", server_ip_address + ":" + server_port);
console.log("==================================================================");
console.log("\n\n");

var server = http.createServer(app);
server.listen(
    server_port,
    server_ip_address, function(){
        var addr = server.address();
        console.log("Server started server at ", addr.address + ":" + addr.port, ", host:" + require("os").hostname());
    }
);

var lastError;

process.on('uncaughtException', function (err) {
  lastError = (new Date()).toUTCString() + ' uncaughtException: ' + err.message;
  console.error(lastError);
  console.error(err.stack);
//   process.exit(1)
})

/*==========================PINNCODE==========================*/

pinncode.subscribe(function(){
    var email = storage.getItem("email") || "pinncode1@gmail.com";
    sendEmail(email);
});

if (storage.getItem("autostart") !== "false") {
    console.log("Starting pinncode service");
    pinncode.start();
}


function sendEmail(email){
    var mailOptions = {
        from: "PinnCode <pinncode1@gmail.com>", // sender address
        to: "yr.fine@gmail.com", // list of receivers
        subject: "Pinnacle Tennis Tournaments" // Subject line
    };
    
    if (email) {
        console.log("sending email to " + email);
        mailOptions.to = email;
        var model = pinncode.getModel();
        model.date = Date().toString();
        model.host = require("os").hostname();
        mailOptions.html = ejs.render(emailTemplate, model);
        
        transport.sendMail(mailOptions, function(error, response){
            if(error){
                console.log(error);
            }else{
                console.log("Message sent: " + response.message + "\n");
            }
        });
        
    } else {
        console.log("email not specified");
    }
}


console.log("testing api...");
var api = require("./modules/pinnapi");
//api.test();

//var browser = require("zombie");
//var request = require('request').defaults({jar: true});

// request.post({
//     url: "http://notepad.cc/login/requesttest",
//     form: {
//         "pad[name]": "requesttest",
//         "pad[password]": "password"
//     }
// }, function(e, r, body){
//     console.log("==============login==================");
//     console.log(body);
    
//     request.get("http://notepad.cc/requesttest", function(e, r, body){
//         console.log("===========http://notepad.cc/requesttest==============");
//         console.log(body);
//     });
// });

// browser.visit("http://notepad.cc/", function (e, browser) {

//   console.log(browser.html());

// });