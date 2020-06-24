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
	let doneSong = {};
	
	audioPromise.then(files => {
		for(const x in files) {
			if (files[x].type != 'image/jpeg' && files[x].type != 'application/vnd.ms-wpl' && files[x].type != undefined) {
				audios.push(files[x])
			}
		}

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

				doneSong = {"artist": data.artist, "title": data.title}
				currentDuration()
			})
			.catch(err => {
				console.log(err)
			})
		}
	}
	
	function playRandomSong() {
		const random = Math.floor(Math.random() * audios.length);
		
		playMusic(audios[random]);
	}

	function pauseMusic(){
		audio.pause();
	}

	function resumeMusic(){
		audio.play();
	}

	function currentDuration() {
		let scrobble = false;
		audio.addEventListener('timeupdate', (e) => {
			if(!scrobble) {
				if (audio.currentTime > (audio.duration / 2)) {
					scrobble = true;
					console.log(doneSong);


					fetch('/scrobble', {
						method: 'post',
						headers: {
							'Content-Type': 'application/json'
						},
						body: JSON.stringify(doneSong)
					}).then(response => {
						return response.json();
					}).then(data => {
						console.log('scrobbled');
					}).catch(err => {
						console.log(err)
					})

				}
			}
		})
	}

})
