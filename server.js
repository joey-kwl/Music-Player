const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mm = require('music-metadata');
const decode = require('audio-decode');

const app = express();
const publicPath = path.join(__dirname, '../public');

app.use(express.static('public'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb'}));

app.get('/', (req, res) => {
	res.send('test');
});

app.post('/music', (req, res) => {
	decode(req.body.test, (err, audioBuffer) => {
		let filebuffer = new Buffer.from(req.body.test, 'base64');
		
		mm.parseBuffer(filebuffer, 'audio/mpeg')
		.then( metadata => {
			if (metadata.common.artist != undefined && metadata.common.title != undefined) {
				console.log(metadata.common.artist);
				console.log(metadata.common.title);

				res.send(JSON.stringify({artist: metadata.common.artist, title: metadata.common.title, code: 200}));
			} else {
				res.send(JSON.stringify({code: 503}));
			}
		});
	});
})



app.listen(3000, () => console.log('Starting app. Port: 3000'));
