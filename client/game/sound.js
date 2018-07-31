
import allAssets from './data/assets';

const assets = {...allAssets.music, ...allAssets.sounds};
const VOLUME_CHANGE_TIME = 0.5; // seconds

class Sound {

	constructor(assetsLoaded, musicVolume, soundVolume) {
		this.ctx = new AudioContext();
		this.soundReady = false;
		this.activeSounds = [];
		this.musicVolume = musicVolume;
		this.soundVolume = soundVolume;

		this.loadAssets(Object.keys(assets)).then(() => {
			this.soundReady = true;
			assetsLoaded();
		});
	}

	loadAssets(assetList) {
		return new Promise((resolve, reject) => {
			let loaded = 0;

			assetList.forEach(assetName => {
				const asset = assets[assetName];
				const request = new XMLHttpRequest();

				request.open('GET', `static/${asset.url}`, true);
				request.responseType = 'arraybuffer';

				request.onload = () => {
					this.ctx.decodeAudioData(request.response, buffer => {
						asset.buffer = buffer;
						loaded++;
						if (loaded === assetList.length) {
							resolve();
						}
					});
				};
				request.send();
			});
		});
	}

	playMusic(musicName) {
		if (!this.soundReady) {
			return console.warn(`Error: play music failed, Sound is not ready yet.`);
		}

		const asset = assets[musicName];

		if (this.activeMusic) {
			this.nextMusic = asset;
			this.activeMusic.ending = true;
			this.activeMusic.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + VOLUME_CHANGE_TIME);
			setTimeout(() => {
				this.activeMusic.source.stop();
				this.activeMusic = asset;
			}, VOLUME_CHANGE_TIME * 1000);
		} else {
			this.activeMusic = asset;
		}
		asset.source = this.ctx.createBufferSource();
		asset.source.loop = true;
		asset.source.buffer = asset.buffer;

		asset.gainNode = this.ctx.createGain();
		asset.gainNode.gain.value = 0;
		asset.gainNode.gain.linearRampToValueAtTime(this.musicVolume, this.ctx.currentTime + VOLUME_CHANGE_TIME);
		asset.gainNode.connect(this.ctx.destination);
		asset.source.connect(asset.gainNode);
		asset.source.start(0);
	}

	playSound(soundName) {
		const asset = assets[soundName];

		asset.source = this.ctx.createBufferSource();
		asset.source.buffer = asset.buffer;

		asset.gainNode = this.ctx.createGain();
		asset.gainNode.gain.value = this.soundVolume;
		asset.gainNode.connect(this.ctx.destination);
		asset.source.connect(asset.gainNode);
		asset.source.start(0);
		this.activeSounds.push(asset);
		asset.source.onended = () => this.activeSounds = this.activeSounds.filter(match => match !== asset);
	}

	setVolume(type, volume) {
		if (type === 'sound') {
			this.activeSounds.forEach(asset => {
				this.soundVolume = volume;
				asset.gainNode.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + VOLUME_CHANGE_TIME);
			});
		} else {
			const activeMusic = this.activeMusic.ending ? this.nextMusic : this.activeMusic;

			this.musicVolume = volume;
			activeMusic.gainNode.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + VOLUME_CHANGE_TIME);
		}
	}

};

export default Sound;
