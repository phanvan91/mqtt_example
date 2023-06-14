const mqtt = require('mqtt')
const express = require('express')
const path = require('path');
const app = express()
const mqttClient = mqtt.connect('mqtt://localhost:1883')
const bodyParser = require('body-parser');
var fs = require('fs');

app.use(express.static(path.join(__dirname, 'public')));

// Connect to the MQTT broker
mqttClient.on('connect', function () {
    console.log('Connected to MQTT broker')
})

mqttClient.on('error', function (e) {
    console.log(e, "ERROR");
    mqttClient.end()
});

app.use(bodyParser.urlencoded({extended: true}));

// MQTT middleware for publishing and subscribing
app.use(function (req, res, next) {
    // Publish messages
    req.mqttPublish = function (topic, message) {
        mqttClient.publish(topic, message)
    }

    // Subscribe to topic
    req.mqttSubscribe = function (topic, callback) {
        console.log(topic, 'topic mqttSubscribe')
        mqttClient.subscribe(topic)
        mqttClient.on('message', function (t, m) {
            console.log(t, 'mqttSubscribe')
            if (t === topic) {
                callback(m.toString())
            }
        })
    }
    next()
})

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/get-nickname', async function (req, res) {
    let a = getNickName();
    res.json({
        msg: 'get users success',
        data: a
    })
});

app.post('/create-nickname', function (req, res) {
    let a = getNickName();
    if(a.includes(req.body.nickname)) {
        return res.status(422).json({
            msg: 'nickname is exist',
        })
    }
    a.push(req.body.nickname);
    var json = JSON.stringify(a);
    let result = fs.writeFileSync('myjsonfile.json', json, 'utf8');
    mqttClient.publish('create_nickname', 'success');

    return res.json({
        msg: 'get users success',
        data: result
    })
});

app.post('/delete-nickname', function (req, res) {
    let a = getNickName();
    if (a.length > 0) {
        for (var i = 0; i < a.length; i++) {
            if (a[i] === req.body.nickname) {
                a.splice(i, 1);
            }
        }
    }
    var json = JSON.stringify(a);
    let result = fs.writeFileSync('myjsonfile.json', json, 'utf8');
    mqttClient.publish('delete_nickname', 'success');

    res.json({
        msg: 'get users success',
        data: result
    })
});

app.post('/send-message', function (req, res) {
    let body = req.body;

    mqttClient.publish('chat', JSON.stringify(body));
    res.json({
        msg: 'get users success',
    })
});


function getNickName() {
    let a = [];
    if (fs.existsSync('myjsonfile.json')) {
        let read = fs.readFileSync('myjsonfile.json', 'utf8');
        if (read) {
            a = JSON.parse(read);
        }
    }
    return a;
}

// app.get('/mqtt/auth', function (req, res) {
//
//     console.log('api auth')
//
//     if(req.query && req.query.username) {
//         console.log(req.query.username,'req');
//         return res.json({
//             result: 'allow',
//         })
//     }
//
//     return res.json({
//         result: 'deny',
//     });
//
// })

app.listen(3000, function () {
    console.log('Server is running on port 3000')
})

// app.listen(8080, function () {
//     console.log('Server is running on port 8080')
// })