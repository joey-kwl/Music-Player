function shuffle(arr) {
	for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

document.addEventListener('DOMContentLoaded', () => {
	let songDetails = {};

	if ('mediaSession' in navigator) {
		navigator.mediaSession.metadata = new MediaMetadata(songDetails);
	  
		navigator.mediaSession.setActionHandler('play', resumeMusic);
		navigator.mediaSession.setActionHandler('pause', pauseMusic);
		navigator.mediaSession.setActionHandler('nexttrack', playRandomSong);
	}

	const audioInput = document.getElementById('audioInput');
	const audio = document.getElementById('aud');
	audio.volume = 0.05;

	audio.addEventListener('ended', playRandomSong);
	document.getElementById('next').addEventListener('click', playRandomSong);
	
	const audioPromise = new Promise((res, rej) => {
		audioInput.addEventListener('change', (e) => {
			return res(e.target.files);
		})
	});

	let audios = [];
	let currentSong = {};
	let hasScrobbled = false;

	audioPromise.then(files => {
		for(const x in files) {
			if (files[x].type != 'image/jpeg' && files[x].type != 'application/vnd.ms-wpl' && files[x].type != undefined) {
				audios.push(files[x])
			}
		}

		audios = shuffle(audios)

		playRandomSong();
	});

	function playMusic(src) {

		const filereader = new FileReader();
		filereader.readAsDataURL(src);

		filereader.onload = (e) => {
			audio.src = e.target.result;

			fetch('/music', {
				method: 'post',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({"audio": e.target.result})
			}).then(response => {
				return response.json();
			}).then(data => {				
				if (data.code == 200) {
					songDetails.title = data.title;
					songDetails.artist = data.artist;
					navigator.mediaSession.metadata = new MediaMetadata(songDetails);
				} else {
					songDetails.title = src.name;
					songDetails.artist = '';
					navigator.mediaSession.metadata = new MediaMetadata(songDetails);
				}
				
				currentSong = {"artist": data.artist, "title": data.title}				
			})
			.catch(err => {
				console.log(err)
			})
		}

	}
	
	function playRandomSong() {
		const random = Math.floor(Math.random() * audios.length);
		if (!hasScrobbled) {
			setInterval(() => {
				scrobbles();
			}, 1000);
		}
		playMusic(audios[random])
		setTimeout(() => {
			hasScrobbled = false;
		}, 1000);

	}

	function pauseMusic(){
		audio.pause();
	}

	function resumeMusic(){
		audio.play();
	}

	function scrobbles() {
		if(!hasScrobbled) {
			if (audio.currentTime > (audio.duration / 2)) {
				hasScrobbled = true;
				console.log(`Scrobbling: ${currentSong.artist} - ${currentSong.title}`)

				fetch('/scrobble', {
					method: 'post',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(currentSong)
				}).then(response => {
					return response.json();
				}).then(data => {
					if (data.status == 200) {
						songLogger();
						console.log(`Scrobbled: ${currentSong.artist} - ${currentSong.title}`);
					}
				}).catch(err => {
					console.log(err)
				})

			}
		}
		
	}

	function songLogger() {
		const date = new Date();
		const logs = document.querySelector('.logs');
		const div = document.createElement('div');
		const artist = document.createElement('div')
		
		div.classList.add('log');
		artist.innerHTML = `${date.getHours()}:${date.getMinutes()} | Scrobbled: ${currentSong.artist} - ${currentSong.title}`
		
		div.appendChild(artist);
		logs.appendChild(div);
		
		logs.scrollTop = logs.scrollHeight - logs.clientHeight;
	}

})
