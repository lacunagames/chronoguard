
import {soundMusic as allMusic, soundEffects as allEffects} from './data/data.json';
import config from '../config';

const assets = [...allMusic, ...allEffects].map((name, index) => ({name, isMusic: index < allMusic.length}));
const VOLUME_CHANGE_TIME = 0.5; // seconds

class Sound {

	constructor(assetsLoaded, musicVolume, soundVolume) {
		this.ctx = new AudioContext();
		this.soundReady = false;
		this.activeSounds = [];
		this.musicVolume = musicVolume;
		this.soundVolume = soundVolume;

		this.loadAssets(assets).then(() => {
			this.soundReady = true;
			assetsLoaded();
		});
	}

	loadAssets(assetList) {
		return new Promise((resolve, reject) => {
			let loaded = 0;

			assetList.forEach(assetObj => {
				const request = new XMLHttpRequest();

				request.open('GET', `static/${assetObj.isMusic ? config.musicPath : config.effectsPath}/${assetObj.name}.mp3`, true);
				request.responseType = 'arraybuffer';

				request.onload = () => {
					this.ctx.decodeAudioData(request.response, buffer => {
						assetObj.buffer = buffer;
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

		const assetObj = assets.find(assetObj => assetObj.name === musicName && assetObj.isMusic);

		if (this.activeMusic) {
			this.nextMusic = asset;
			this.activeMusic.ending = true;
			this.activeMusic.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + VOLUME_CHANGE_TIME);
			setTimeout(() => {
				this.activeMusic.source.stop();
				this.activeMusic = assetObj;
			}, VOLUME_CHANGE_TIME * 1000);
		} else {
			this.activeMusic = assetObj;
		}
		assetObj.source = this.ctx.createBufferSource();
		assetObj.source.loop = true;
		assetObj.source.buffer = assetObj.buffer;

		assetObj.gainNode = this.ctx.createGain();
		assetObj.gainNode.gain.value = 0;
		assetObj.gainNode.gain.linearRampToValueAtTime(this.musicVolume, this.ctx.currentTime + VOLUME_CHANGE_TIME);
		assetObj.gainNode.connect(this.ctx.destination);
		assetObj.source.connect(assetObj.gainNode);
		assetObj.source.start(0);
	}

	playSound(soundName) {
		const assetObj = assets.find(assetObj => assetObj.name === soundName && !assetObj.isMusic);

		assetObj.source = this.ctx.createBufferSource();
		assetObj.source.buffer = assetObj.buffer;

		assetObj.gainNode = this.ctx.createGain();
		assetObj.gainNode.gain.value = this.soundVolume;
		assetObj.gainNode.connect(this.ctx.destination);
		assetObj.source.connect(assetObj.gainNode);
		assetObj.source.start(0);
		this.activeSounds.push(assetObj);
		assetObj.source.onended = () => this.activeSounds = this.activeSounds.filter(match => match !== assetObj);
	}

	setVolume(type, volume) {
		if (type === 'sound') {
			this.activeSounds.forEach(assetObj => {
				this.soundVolume = volume;
				assetObj.gainNode.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + VOLUME_CHANGE_TIME);
			});
		} else {
			const activeMusic = this.activeMusic.ending ? this.nextMusic : this.activeMusic;

			this.musicVolume = volume;
			activeMusic.gainNode.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + VOLUME_CHANGE_TIME);
		}
	}

};

export default Sound;
