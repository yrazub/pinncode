var http = require('http');
var path = require('path');
var express = require('express');
var url = require('url');
var nodemailer = require("nodemailer");
var storage = require('node-persist');
var transport = nodemailer.createTransport("SMTP", {
    service: "Gmail",
    auth: {
        user: "pinncode1@gmail.com",
        pass: "RafaelNadal"
    }
});
var pinncode = require("./pinncode");
var ejs = require('ejs'),
    fs = require('fs'),
    emailTemplate = fs.readFileSync(__dirname + '/email.ejs', 'utf8');

var app = express();

app.get('/', function(req, res){
    console.log("default route call");
    var config = pinncode.getConfig();
    res.render("client/index.html", config);
});

app.get('/send', function(req, res){
    var email = url.parse(req.url, true).query.email;
    sendEmail(email);
    storage.setItem("email", email)
    
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

app.use(express.basicAuth("pinncode", "p1NNcode1"));
app.use(express.static(path.resolve(__dirname, 'client')));
app.engine('.html', ejs.__express);
app.set('views', __dirname);

var server_port = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3000;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || process.env.IP || "0.0.0.0";

console.log("...Trying to start server at ", server_ip_address + ":" + server_port);

var server = http.createServer(app);
server.listen(
    server_port,
    server_ip_address, function(){
        var addr = server.address();
        console.log("Created server at ", addr.address + ":" + addr.port);
    }
);

pinncode.subscribe(function(){
    console.log("==========callback===========");
    var email = storage.getItem("email") || "pinncode1@gmail.com";
    sendEmail(email);
});

function sendEmail(email){
    var mailOptions = {
        from: "PinnCode <pinncode1@gmail.com>", // sender address
        to: "yr.fine@gmail.com", // list of receivers
        subject: "Pinnacle Tennis Tournaments" // Subject line
    };
    
    if (email) {
        console.log("sending email to " + email);
        mailOptions.to = email;
        mailOptions.html = ejs.render(emailTemplate, {
            tournaments: pinncode.getTournaments(),
            date: Date().toString()
        });
        
        transport.sendMail(mailOptions, function(error, response){
            if(error){
                console.log(error);
            }else{
                console.log("Message sent: " + response.message);
            }
        });
        
    } else {
        console.log("email not specified");
    }
}

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