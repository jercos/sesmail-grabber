const path = require('path');
var app = require('express')();
var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var fs = require('fs');
var https = require('https');
var MessageValidator = require('sns-validator');
var validator = new MessageValidator();

var config = {
	maildir: "/home/sesmail/Maildir",
	port: 17231,
	bind: '127.0.0.1',
};

var bodyParser = require('body-parser');
// All POST bodies are expected to be JSON, and SNS currently uses text/plain for some reason.
app.use(bodyParser.json( { type: '*/*' } ));

app.get('/', function (req, res) {
	res.send('This is an Amazon SNS notification endpoint. For more information see https://github.com/jercos/sesmail-grabber');
});

app.post('/message', function(req, res) {
	var orig = req.body;
	validator.validate(req.body, function(err, message) {
		if (err) {
			console.log("Invalid request", JSON.stringify(orig));
			res.status(403).send("Invalid SNS POST.");
			return;
		}
		if (message.Type === 'SubscriptionConfirmation') {
			https.get(message['SubscribeURL'], function (subres) {
				console.log("Confirmed subscription");
				res.send("Confirmed subscription");
			});
		} else if (message.Type === 'UnsubscribeConfirmation') {
			https.get(message['SubscribeURL'], function (subres) {
				console.log("Confirmed unsubscription");
				res.send("Confirmed unsubscription");
			});
		} else if (message.Type === 'Notification') {
			var msg = JSON.parse(message.Message);
			var recordCount = msg.Records.length;
			for (var i = 0; i < recordCount; i++) {
				if (msg.Records[i].eventName !== 'ObjectCreated:Put') {
					continue;
				}
				var bucket = msg.Records[i].s3.bucket.name;
				var key = msg.Records[i].s3.object.key;
				var keyName = key.match(/\//) ? key.split('/', 2)[1] : key;
				console.log("New mail message");
				s3.getObject({
					Bucket: bucket,
					Key: key
				}, function(err, data){
					if (err) {
						console.log(err, err.stack);
						res.status(500).send("Error getting S3 object");
						return;
					} else {
						console.log(data)
						var tmpFile = path.join(config.maildir, "tmp", keyName);
						var newFile = path.join(config.maildir, "new", keyName);
						fs.writeFile(tmpFile, data.Body, function(err) {
							if (err) {
								console.log('Failed to write', data.Body, "to", tmpFile);
								res.status(500).send("Error writing object to disk");
								return;
							} else {
								fs.renameSync(tmpFile, newFile);
								console.log("New message:", keyName);
							}
						});
					}
				});
			}
			res.send("Message recieved");
		} else {
			console.log(JSON.stringify(req.body, null, '\t'));
			res.send('Receieved');
		}
	});
});

app.listen(config.port, config.bind, 511, function() {
	console.log('Started on port ' + config.port);
});
