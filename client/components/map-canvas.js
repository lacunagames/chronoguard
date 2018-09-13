
import './map-canvas.scss';

import React from 'react';

import utils from 'utils';
import config from 'config';
import {mapImages as allImages, mapVideos as allVideos} from '../game/data/data.json';

const assets = [...allImages, ...allVideos].map((name, index) => ({name, isVideo: index >= allImages.length}));
const animSpeed = 500;

class MapCanvas extends React.Component {

	constructor(props) {
		super(props);
		utils.bindThis(this, ['windowResize', 'drawMap']);
		this.assetsLoaded = false;
		this.mapObjs = [...this.props.map.sort((a, b) => a.priority - b.priority)];
		this.debounceWindowResize = utils.debounce(this.windowResize, 150);
	}

	componentDidMount() {
		this.loadAssets(assets).then(() => {
			this.assetsLoaded = true;
			this.windowResize();
			utils.onEvent(window, 'resize', this.debounceWindowResize);
		});
	}

	componentWillUnmount() {
		this.debounceWindowResize.clear();
		utils.offEvent(window, 'resize', this.debounceWindowResize);
	}

	componentDidUpdate(prevProps) {
		if (prevProps.map !== this.props.map) {
			this.mapObjs = this.mapObjs.filter(mapObj => this.props.map.find(match => match.id === mapObj.id));
			this.props.map.forEach(mapObj => {
				const existingObj = this.mapObjs.find(match => match.id === mapObj.id);
				const existingAnim = existingObj && existingObj.animation;

				if (!existingObj) {
					this.mapObjs.push({...mapObj});
				}
				const updateObj = existingObj ? Object.assign(existingObj, mapObj) : this.mapObjs[this.mapObjs.length - 1];

				if (mapObj.animation && !existingAnim) {
					const assetObj = assets.find(assetObj => assetObj.name === mapObj.name);
					updateObj.animDuration = assetObj.isVideo ? assetObj.element.duration * 1000 : animSpeed;
					updateObj.animStarted = + new Date();

					if (assetObj.isVideo) {
						updateObj.video = document.createElement('video');
						updateObj.video.oncanplaythrough = () => updateObj.animLoaded = true;
						updateObj.video.src = assetObj.element.src;
						updateObj.video.load();
					}
				}
			});
			this.mapObjs.sort((a, b) => a.priority - b.priority);
			this.drawMap();
		}
	}

	windowResize() {
		const canvas = this.refs.canvasFull;

		canvas.width = canvas.parentElement.clientWidth * config.mapDensity;
		canvas.height = canvas.parentElement.clientHeight * config.mapDensity;
		canvas.style.width = `${canvas.parentElement.clientWidth}px`;
		canvas.style.height = `${canvas.parentElement.clientHeight}px`;

		// Keep 4:3 aspect ratio with horizontal or vertical padding
		this.spanWidth = canvas.width / 4 < canvas.height / 3;

		// Scale to fit = original size 1200 x 900
		this.scale = utils.round(this.spanWidth ? canvas.width / config.mapWidth : canvas.height / config.mapHeight, 6);

		this.offsetX = this.spanWidth ? 0 : (canvas.width - config.mapWidth * this.scale) / 2;
		this.offsetY = this.spanWidth ? (canvas.height - config.mapHeight * this.scale) / 2 : 0;

		const mapWidth = this.spanWidth ? canvas.width : utils.round(canvas.height * 4 / 3, 2);
		const mapHeight = this.spanWidth ? utils.round(mapWidth * 3 / 4, 2) : canvas.height;

		this.props.updateEventsPosition(this.offsetX / config.mapDensity, this.offsetY / config.mapDensity, mapWidth / config.mapDensity, mapHeight / config.mapDensity);
		this.drawMap();
	}

	loadAssets(assetList) {
		return new Promise((resolve, reject) => {
			let loaded = 0;

			assetList.forEach(assetObj => {
				if (assetObj.isVideo) {
					const request = new XMLHttpRequest();

					request.open('GET', `static/${config.videosPath + assetObj.name}.mp4`, true);
					request.responseType = 'blob';

					request.onload = () => {
						if (request.status === 200) {
							assetObj.element = document.createElement('video');
							assetObj.element.oncanplaythrough = () => {
								assetObj.element.width = assetObj.element.videoWidth;
								assetObj.element.height = assetObj.element.videoHeight;
								assetObj.isVideo = true;
								loaded++;
								if (loaded === assetList.length) {
									resolve();
								}
							};
							assetObj.element.src = URL.createObjectURL(request.response);
						} else {
							console.warn(`Error loading ${assetObj.name} video. Status code: ${request.status}.`);
						}
					};
					request.onerror = () => console.warn(`Error loading ${assetObj.name} video.`);
					request.send();

				} else {
					assetObj.element = new Image();
					assetObj.element.onload = () => {
						if (assetObj.element.width + assetObj.element.height === 0) {
							console.warn(`Error loading ${assetObj.name} image.`);
							return reject();
						}
						loaded++;
						if (loaded === assetList.length) {
							resolve();
						}
					};
					assetObj.element.src = `static/${config.imagesPath + assetObj.name}.png`;
				}
			});
		});
	}

	getScaledAsset(assetName, state) {
		const assetObj = assets.find(assetObj => assetObj.name === assetName);

		if (assetObj.lastScale !== this.scale || assetObj.lastState !== state) {
			const scaleCanvas = document.createElement('canvas');

			scaleCanvas.width = assetObj.element.width * this.scale;
			scaleCanvas.height = assetObj.element.height * this.scale;

			const ctx = scaleCanvas.getContext('2d');

			ctx.globalAlpha = state === 'hidden' ? 0 : 1;
			ctx.drawImage(assetObj.element, 0, 0, scaleCanvas.width, scaleCanvas.height);
			assetObj.scaledImg = scaleCanvas;
			assetObj.lastScale = this.scale;
			assetObj.lastState = state;
		}
		return assetObj.scaledImg;
	}

	animateImg(mapObj) {
		const animCanvas = document.createElement('canvas');
		const now = + new Date();

		if (mapObj.video) {
			if (!mapObj.animLoaded) {
				return;
			} else if (!mapObj.animPlaying) {
				mapObj.video.play();
				mapObj.animPlaying = true;
				mapObj.animStarted = now;
			}
			if (!mapObj.video.ended) {
				animCanvas.width = mapObj.video.videoWidth * this.scale;
				animCanvas.height = mapObj.video.videoHeight * this.scale;
				const ctx = animCanvas.getContext('2d');

				ctx.drawImage(mapObj.video, 0, 0, animCanvas.width, animCanvas.height);

				// Add opacity for black
				const imgData = ctx.getImageData(0, 0, animCanvas.width, animCanvas.height);
				const dataLength = imgData.data.length;

				for (let i = 0; i < dataLength; i += 4) {
					if (imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2] < 350) {
						imgData.data[i + 3] = 0;
					}
				}
				ctx.putImageData(imgData, 0, 0);
			}

		} else {
			const img = this.getScaledAsset(mapObj.name, mapObj.state);

			animCanvas.width = img.width;
			animCanvas.height = img.height;

			const ctx = animCanvas.getContext('2d');

			switch(mapObj.animation) {
				case 'create':
				case 'show':
					ctx.globalAlpha = utils.round(utils.easeOut(now - mapObj.animStarted, 0.01, 0.99, mapObj.animDuration), 2);
					break;

				case 'destroy':
				case 'hide':
					ctx.globalAlpha = utils.round(utils.easeIn(now - mapObj.animStarted, 1, -0.99, mapObj.animDuration), 2);
					break;
			}
			ctx.drawImage(img, 0, 0);
		}

		if (mapObj.animStarted + mapObj.animDuration <= now || mapObj.video && mapObj.video.ended) {
			if (mapObj.animation === 'destroy' || mapObj.video) {
				this.mapObjs.splice(this.mapObjs.indexOf(mapObj), 1);
				this.props.dispatch('removeMapObj', mapObj.id);
			} else {
				const state = mapObj.animation === 'hide' ? 'hidden' : mapObj.state;

				mapObj.animation = '';
				mapObj.state = state;
				this.props.dispatch('updateMapObj', mapObj.id, {animation: '', state});
			}
		}
		if (mapObj.animStarted + mapObj.animDuration < now && !mapObj.video) {
			return mapObj.animation !== 'destroy' && this.getScaledAsset(mapObj.name, mapObj.state);
		}
		return animCanvas;
	}

	drawMap() {
		if (!this.assetsLoaded) {
			return;
		}

		const canvas = this.refs.canvasFull;
		const ctx = canvas.getContext('2d');

		const scaledBg = this.getScaledAsset('background');
		const bgOffsetX = this.offsetX % scaledBg.width - scaledBg.width;
		const bgOffsetY = this.offsetY % scaledBg.height - scaledBg.height;

		ctx.save();
		ctx.translate(bgOffsetX, bgOffsetY);
		ctx.fillStyle = ctx.createPattern(scaledBg, 'repeat');
		ctx.fillRect(-bgOffsetX, -bgOffsetY, canvas.width, canvas.height);
		ctx.restore();

		this.mapObjs.forEach(mapObj => {
			const assetObj = assets.find(assetObj => assetObj.name === mapObj.name);
			const startX = this.offsetX + this.scale * mapObj.posX - assetObj.element.width * this.scale / 2;
			const startY = this.offsetY + this.scale * mapObj.posY - assetObj.element.height * this.scale / 2;
			const img = mapObj.animation ? this.animateImg(mapObj) : this.getScaledAsset(mapObj.name, mapObj.state);

			ctx.imageSmoothingEnabled = false;
			img && ctx.drawImage(img, parseInt(startX), parseInt(startY));
		});
		if (this.mapObjs.some(mapObj => mapObj.animation)) {
			requestAnimationFrame(this.drawMap);
		}
	}

	render() {
		return (
			<canvas className="canvas-full" ref="canvasFull"></canvas>
		);
	}
}

export default MapCanvas;
