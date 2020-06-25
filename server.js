const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mm = require('music-metadata');
const NodeID3 = require('node-id3');
const scribble = require('scribble');
const env = require('dotenv').config();
const parseString = require('xml2js').parseString;

const app = express();
const publicPath = path.join(__dirname, '../public');

app.use(express.static('public'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb'}));

var Scrobbler = new scribble(
	process.env.LASTFM_APIKEY,
	process.env.LASTFM_SECRET,
	process.env.LASTFM_USERNAME,
	process.env.LASTFM_PASSWORD);
	
app.get('/', (req, res) => {
	res.send('test');
});

app.post('/music', (req, res) => {
	let filebuffer = new Buffer.from(req.body.audio, 'base64');
	let tags = NodeID3.read(filebuffer)

	res.send(JSON.stringify({artist: tags.artist, title: tags.title, code: 200}));
	
	// mm.parseBuffer(filebuffer, 'audio/mpeg')
	// .then( metadata => {
	// 	console.log(metadata);
	// 	if (metadata.common.artist != undefined && metadata.common.title != undefined) {
	// 		console.log(metadata.common.artist);
	// 		console.log(metadata.common.title);

	// 		res.send(JSON.stringify({artist: metadata.common.artist, title: metadata.common.title, code: 200}));
	// 	} else {
	// 		res.send(JSON.stringify({code: 503}));
	// 	}
	// });
})

app.post('/scrobble', (req, res) => {
	let song = {
		artist: req.body.artist,
		track: req.body.title,
	};

	Scrobbler.Scrobble(song, xml => {
		parseString(xml, function (err, result) {
			if (result.lfm.$.status == 'ok') {
				console.log(`Scrobbled: ${song.artist} - ${song.track}`)
				res.send(JSON.stringify({status: 200}));
			} else {
				console.log('Failed to scrobble')
				res.send(JSON.stringify({status: 503}))
			}
		});
			
	});

})


app.listen(3000, () => console.log('Starting app. Port: 3000'));
