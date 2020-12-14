// Node imports
var express = require('express');
var fs = require('fs');
var cors = require('cors');
var session = require('express-session');
var https = require('https');
var bodyParser = require('body-parser'); // Pull information from HTML POST (express4)
var app = express(); // Create our app with express

app.use(cors())

// Server configuration
app.use(session({
    saveUninitialized: true,
    resave: false,
    secret: 'MY_SECRET'
}));
app.use(bodyParser.urlencoded({
    'extended': 'true'
})); // Parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // Parse application/json
app.use(bodyParser.json({
    type: 'application/vnd.api+json'
})); // Parse application/vnd.api+json as json

// Listen (start app with node server.js)
var options = {
    key: fs.readFileSync('openvidukey.pem'),
    cert: fs.readFileSync('openviducert.pem')
};
https.createServer(options, app).listen(443);
console.log("App listening on port 443");

/* REST API */
app.post('/moveRecording', (req, res) => {
    let data = req.body;
    exec("./test.sh " + data.sessionName + " " + data.destDir, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.log("delete path: ", data.sessionName)
        console.log("delete path: ", data.destDir)
        res.send(response);
    });
});
