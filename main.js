title = "Beat Mash";

description = `
`;

characters = [];

options = {
	theme: 'crt',
	viewSize: {
		x: 100,
		y: 120
	},
	isReplayEnabled: true
};

// let sound = new Howl({
// 	src: ['./sounds/kickhard129.wav']
// })

let track = new Howl({src: ['./mastodon_nodrum.mp3']});
let drums = {
	36: new Howl({src: ['./sounds/kickhard129.wav']}),// bass tom 3
	38: new Howl({src: ['./sounds/snaremed(L)1.wav']}),// snare 7 -> acoustic snare
	41: new Howl({src: ['./sounds/tom16a1.wav']}),//36, // low floor tom
	43: new Howl({src: ['./sounds/tom13a1.wav']}),//36, // high floor tom
	45: new Howl({src: ['./sounds/tom10a1.wav']}),//36, // low tom
	46: new Howl({src: ['./sounds/sabopen(R)1.wav']}),// close hi hat 5
	47: new Howl({src: ['./sounds/Room-midtom21.wav']}),
	49: new Howl({src: ['./sounds/schna18a1.wav']}),
	51: new Howl({src: ['./sounds/sabfoot(R)11.wav']}),// ride cymbal
	57: 49 // crash cymbal
}

for (let [key, value] of Object.entries(drums)) {
	if (typeof value === 'number') {
		drums[key] = drums[value];
	}
}

let playDrum = (id, velocity) => {
	if (drums[id]) {
		drums[id].play();
		if (id === 46 || id === 49 || id === 57) {
			drums[id].volume((velocity / 200));
		} else {
			drums[id].volume((velocity / 100));
		}
		
	}
}

let fetchMidi = async (url) => {
	let response = await fetch(url, {
		method: 'GET',
		mode: 'no-cors'
	});
	let data = await response.arrayBuffer();

	return data;
}

let midiPlayer = new MidiPlayer.Player();

let spawnMidiPlayer = new MidiPlayer.Player();

let beats = [];

midiPlayer.on('midiEvent', (e) => {
	// console.log(e);
	if (e.track === 7 && e.noteNumber && e.name === 'Note on') {
		// console.log(e)
		if (e.noteNumber === trackedNote) {
			// playDrum(e.noteNumber, e.velocity * trackedVolume);
		} else {
			playDrum(e.noteNumber, e.velocity);
		}
	}
})

spawnMidiPlayer.on('midiEvent', (e) => {
	// console.log(e);
	if (e.track === 7 && e.noteNumber && e.name === 'Note on') {
		// console.log(e)
		// playDrum(e.noteNumber, e.velocity);
		// console.log('spawn midi event')

		if (e.noteNumber === trackedNote) {
			beats.push({
				start: elapsed, 
				target: elapsed + 2000
			})
		}
		

	}
})

fetchMidi('./mastodon.mid')
.then(data => {
	// console.log(data)
	midiPlayer.loadArrayBuffer(data);
	spawnMidiPlayer.loadArrayBuffer(data);
})

// big variables

let trackedNote = 36;
let speedScale = 2;
let pressOffset = 5;

//

let start = Date.now();
let elapsed = start;



let textEffects = [];
let createTextEffect = (text, color = 'white') => {
	textEffects.push({
		text,
		start: elapsed,
		color
	})
}


let playSong = async () => {
	track.stop();
	midiPlayer.stop();
	spawnMidiPlayer.stop();
	beats = [];

	console.log('starting playing');
	track.on('play', () => {
		console.log('started track')
		midiPlayer.play();
		console.log('started midi')
	})
	
	setTimeout(() => {
		track.play();
		track.volume(2);
	}, 2000);
	spawnMidiPlayer.play();
	console.log('started spawn midi')
}



let gameState = 'pre'

midiPlayer.on('endOfFile', () => {
	gameState = 'post'
	console.log('midi ended');
})

let combo = 0;
let bestCombo = 0;
let comboScale = 0;

let setCombo = (val) => {
	combo = val;
	if (combo > bestCombo) {
		bestCombo = combo;
	}
}

let addCombo = (val) => {
	combo += val;
	comboScale = 1;
	if (combo > bestCombo) {
		bestCombo = combo;
	}
}


let pressScale = 0;



let finishedMessage = 'Finished';
let finishedColor = 'black';
let beatCount = 0;
let hitCounts = {
	a: 0, b: 0, c: 0, d: 0
}
let accuracy = 1;


let resetStats = () => {
	score = 0;
	beatCount = 0;
	hitCounts = {
		a: 0, b: 0, c: 0, d: 0
	}
	combo = 0;
	bestCombo = 0;
}



let drumsLoaded = false;

function update() {
	if (!ticks) {
		// similar to on ready or on create
		// playSong();
		
		resetStats();
		gameState = 'pre';
	}

	if (gameState === 'pre') {
		drumsLoaded = true;
		for (let sound of Object.values(drums)) {
			if (typeof sound !== 'number') {
				if (sound.state() !== 'loaded') {
					drumsLoaded = false;
					break;
				}
			}
		}
		if (drumsLoaded && track.state() === 'loaded') {
			text('Press to Start', 10, 40);
		} else {
			text('Loading...', 10, 40);
		}
	}

	if (gameState === 'running') {
		// live combo text
		color('yellow');
		text('x' + combo.toString(), 5, 10, {
			scale: {
				x: 1 + comboScale * .2,
				y: 1 + comboScale * .2
			}
		})
		color('black');
	}
	


	// hit line
	color('blue');
	rect(0,100,100,1);

	color('black');

	if (input.isJustPressed) {
		// play('powerUp')
		// sound.play();
		pressScale = 1;

		switch (gameState) {
			case 'pre':
				if (track.state() === 'loaded') {
					playSong();
					resetStats();
					gameState = 'running'
				}
				break;
			case 'running':

				playDrum(trackedNote, 100);
			
			
				if (beats.length === 0) {
					break;
				}
				
				let currentBeat = beats[0];
				
				let diff = elapsed + pressOffset - currentBeat.target;
				let absDiff = Math.abs(diff);
				// console.log(diff)
				if (diff < -200) {
					
					break;
				} else {
					if (absDiff < 150) {
						addCombo(1);
					} else {
						setCombo(0);
					}

					if (absDiff < 50) {
						createTextEffect('Rad!', 'green');
						addScore(10 * combo);
						hitCounts.a += 1;

						particle(50,100,20,10)
						
					} else if (absDiff < 100) {
						createTextEffect('Cool', 'blue');
						addScore(5 * combo);
						hitCounts.b += 1;
					} else if (absDiff < 150) {
						createTextEffect('Meh', 'light_black');
						addScore(1 * combo);
						hitCounts.c += 1;
					} else {
						createTextEffect('Miss', 'red');
						hitCounts.d += 1;
					}

					beats.splice(0,1);
					beatCount += 1;
				}
				break;
			case 'finished':
				// playSong();
				// resetStats();
				gameState = 'end';
				break;
			default:
				break;
		}
	}


	switch (gameState) {
		case 'post':
			if (!track.playing()) {

				// finalize results
				accuracy = (hitCounts.a + hitCounts.b * .8 + hitCounts.c * .5) / beatCount;

				if (accuracy < .6) {
					finishedMessage = 'Yikes...';
					finishedColor = 'red';
				} else if (accuracy < .75) {
					finishedMessage = 'Nice try';
					finishedColor = 'blue';
				} else if (accuracy < .9) {
					finishedMessage = 'Pretty Good';
					finishedColor = 'green';
				} else {
					finishedMessage = 'Awesome!'
					finishedColor = 'yellow';
				}

				gameState = 'finished'
				console.log('game finished')
			}
			break;
		case 'finished':

			color(finishedColor);
			text(finishedMessage, 10, 35);
			color('black');
			text(`Scr: ${score}`, 5, 50);
			text(`Acc: ${(accuracy * 100).toFixed(1)}%`, 5, 60);
			text(`HiC: ${bestCombo}`, 5, 70);

			text('Press to Retry', 10, 85);
			// end('');
			break;
		case 'end':
			end('');
			break;
		default:
			break;
	}

	// drum stick
	color('yellow');
	rect(0,120 - pressScale * 20,100,pressScale * 20);
	// line(50,120,50,120 - pressScale * 20, 100);

	color('black')

	pressScale *= .9;
	comboScale *= .9;
	

	for (let i = 0; i < beats.length; i++) {
		let beat = beats[i]
		let beatElapsed = elapsed - beat.start;
		let progress = beatElapsed / 2000;

		let startWidth = 20;
		let expansion = 20;

		let height = speedScale * 100;

		rect(50 - startWidth * .5 - progress * expansion * .5,
			(100 - height) + progress * height - 1, 
			startWidth + progress * expansion,
			2
		);
		
		if (progress > 1.05) {
			createTextEffect('Miss', 'red');
			setCombo(0);
			beats.splice(i, 1);

			beatCount += 1;
			hitCounts.d += 1;

			i -= 1;
		}
	}



	for (let i = 0; i < textEffects.length; i++) {
		let textEffect = textEffects[i]
		let textElapsed = elapsed - textEffect.start;
		let progress = textElapsed / 1000;
		color(textEffect.color);
		text(textEffect.text, 75,90 - progress * 30, {
		});
		color('black');
		
		if (progress > 1) {
			textEffects.splice(i, 1);
			i -= 1;
		}
	}

	elapsed = Date.now() - start;
}

addEventListener("load", onLoad);