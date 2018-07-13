
import './map-canvas.scss';

import React from 'react';

import utils from 'utils';
import assets from '../game/data/assets';

const widthOrig = 1200;
const heightOrig = 900;
const animSpeed = 500;

class MapCanvas extends React.Component {

	constructor(props) {
		super(props);
		utils.bindThis(this, ['windowResize', 'drawMap']);
		this.assetsLoaded = false;
		this.animations = [];
		this.debounceWindowResize = utils.debounce(this.windowResize, 150);
	}

	componentDidMount() {
		this.loadAssets(['background', 'island', 'forest', 'forest2']).then(() => {
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
			this.props.map.forEach(mapObj => {
				if (mapObj.animation && !this.animations.find(anim => anim.id === mapObj.id)) {
					this.animations.push({
						id: mapObj.id,
						type: mapObj.animation,
						duration: animSpeed,
						started: + new Date(),
					});
				}
			});
			this.drawMap();
		}
	}

	windowResize() {
		const canvas = this.refs.canvasFull;

		canvas.width = canvas.parentElement.clientWidth;
		canvas.height = canvas.parentElement.clientHeight;

		// Keep 4:3 aspect ratio with horizontal or vertical padding
		this.spanWidth = canvas.width / 4 < canvas.height / 3;

		// Scale to fit = original size 1200 x 900
		this.scale = Math.round((this.spanWidth ? canvas.width / widthOrig : canvas.height / heightOrig) * 100000) / 100000;

		this.offsetX = this.spanWidth ? 0 : (canvas.width - widthOrig * this.scale) / 2;
		this.offsetY = this.spanWidth ? (canvas.height - heightOrig * this.scale) / 2 : 0;

		const mapWidth = this.spanWidth ? canvas.width : Math.round(canvas.height * 4 / 3 * 100) / 100;
		const mapHeight = this.spanWidth ? Math.round(mapWidth * 3 / 4 * 100) / 100 : canvas.height;

		this.props.updateEventsPosition(this.offsetX, this.offsetY, mapWidth, mapHeight);
		this.drawMap();
	}

	loadAssets(assetList) {
		return new Promise((resolve, reject) => {
			let loaded = 0;

			assetList.forEach(assetName => {
				const asset = assets[assetName];
				const img = new Image();

				img.onload = () => {
					if (img.width + img.height === 0) {
						console.warn(`Error loading ${asset.url} image.`);
						return reject();
					}
					asset.img = img;
					loaded++;
					if (loaded === assetList.length) {
						resolve();
					}
				};
				img.src = asset.url;
			});
		});
	}

	getScaledAsset(assetName, state) {
		const asset = assets[assetName];

		if (asset.lastScale !== this.scale || asset.lastState !== state) {
			const scaleCanvas = document.createElement('canvas');

			scaleCanvas.width = asset.img.width * this.scale;
			scaleCanvas.height = asset.img.height * this.scale;

			const ctx = scaleCanvas.getContext('2d');

			ctx.globalAlpha = state === 'hidden' ? 0 : 1;
			ctx.drawImage(asset.img, 0, 0, scaleCanvas.width, scaleCanvas.height);
			asset.scaledImg = scaleCanvas;
			asset.lastScale = this.scale;
			asset.lastState = state;
		}
		return asset.scaledImg;
	}

	animateImg(anim, mapObj) {
		const animCanvas = document.createElement('canvas');
		const img = this.getScaledAsset(mapObj.name, mapObj.state);
		const now = + new Date();
		const easeOut = (time, startVal, change, duration) => change * Math.sin(time / duration * (Math.PI / 2)) + startVal;
		const easeIn = (time, startVal, change, duration) => -change * Math.cos(time / duration * (Math.PI / 2)) + change + startVal;
		const linear = (time, startVal, change, duration) => change * time / duration + startVal;
		const round = value => Math.round(value * 100) / 100;

		animCanvas.width = img.width;
		animCanvas.height = img.height;

		const ctx = animCanvas.getContext('2d');

		switch(anim.type) {
			case 'create':
			case 'show':
				ctx.globalAlpha = round(easeOut(now - anim.started, 0.1, 1, anim.duration));
				break;

			case 'destroy':
			case 'hide':
				ctx.globalAlpha = round(easeIn(now - anim.started, 1, -0.9, anim.duration));
				break;
		}

		ctx.drawImage(img, 0, 0);
		if (anim.started + anim.duration <= now) {
			this.animations.splice(this.animations.indexOf(anim), 1);
			this.props.dispatch('animationEnded', anim.id);
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
		this.props.map.forEach(mapObj => {
			const asset = assets[mapObj.name];
			const startX = this.offsetX + this.scale * mapObj.posX - asset.img.width * this.scale / 2;
			const startY = this.offsetY + this.scale * mapObj.posY - asset.img.height * this.scale / 2;
			const animation = this.animations.find(anim => anim.id === mapObj.id);
			const img = animation ? this.animateImg(animation, mapObj) : this.getScaledAsset(mapObj.name, mapObj.state);

			ctx.drawImage(img, startX, startY);
		});
		if (this.animations.length) {
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
