
let throttleCounter = 0;
const isThrottled = {};

const utils = {

	// Bind this value to array items
	bindThis: (that, fnArray) => {
		fnArray.forEach((fn) => {
			if (!that[fn]) {
				return console.log(`${fn} function not found`);
			}
			that[fn] = that[fn].bind(that);
		});
	},

	// Create className string from className => isActive object
	getClassName: (classesObj) => {
		let classes = [];

		for (let className in classesObj) {
			if (classesObj[className]) {
				classes.push(className);
			}
		}
		return classes.join(' ');
	},

	deepClone: obj => JSON.parse(JSON.stringify(obj)),

	// Deep equal comparison
	isEqual: (a, b, extendedAllowed) => {
		if (typeof a !== typeof b) {
			return false;
		}
		if (typeof a !== 'object') {
			return a === b;
		}
		return (extendedAllowed || Object.keys(a).length === Object.keys(b).length) && !Object.keys(a).some(key => {
			return !utils.isEqual(a[key], b[key]);
		});
	},

	// Forgiving value comparison to select object in array
	pickWild: (array, prop, value = '') => {
		const val = value.toLowerCase().trim();

		array = array || [];
		for (let i = 0; i < array.length; i += 1) {
			if (array[i][prop].toLowerCase().trim() === val) {
				return array[i];
			}
		}
		return undefined;
	},

	pickWildIndex: (array, prop, value) => (array || []).indexOf(utils.pickWild(array, prop, value)),

	isObj: obj => typeof obj === 'object' && !(obj instanceof Array),

	// Return random integer between min max values, eg. 12-14'
	getRandom(number, multiplier) {
		const splitNumber = (number + '').replace(/\s/g, '').split('-');
		const min = isNaN(+splitNumber[0]) ? number : +splitNumber[0];
		const max = +splitNumber[1];
		const random = max ? Math.floor(Math.random() * (max - min + 1) + min) : min;

		return typeof multiplier === 'number' ? random * multiplier : random;
	},

	// Create multiple eventListeners on elem
	onEvent: (elem, eventList, handler) => {
		eventList.split(' ').forEach(eventName => elem.addEventListener(eventName, handler));
	},

	// Remove eventListeners after first event firing
	oneEvent: (elem, eventList, handler) => {
		const oneHandler = () => {
			handler();
			utils.offEvent(elem, eventList, oneHandler);
		};
		utils.onEvent(elem, eventList, oneHandler);
	},

	// Remove multiple eventListeners from elem
	offEvent: (elem, eventList, handler) => {
		eventList.split(' ').forEach(eventName => elem.removeEventListener(eventName, handler));
	},

	throttle: (fn, delay) => {
		const id = throttleCounter;
		let timer;
		const fnThrottled = (...args) => {
			if (isThrottled[id]) {
				return;
			}
			isThrottled[id] = true;
			timer = setTimeout(() => isThrottled[id] = false, delay);
			fn(...args);
		};

		isThrottled[id] = false;
		throttleCounter++;
		fnThrottled.clear = () => clearTimeout(timer);

		return fnThrottled;
	},

	debounce: (fn, delay, preFn) => {
		let timer;
		let isFirst = true;
		const fnDebounced = (...args) => {
			clearTimeout(timer);
			if (isFirst) {
				isFirst = false;
				preFn && preFn();
			}
			timer = setTimeout(() => {
				fn(...args);
				isFirst = true;
			}, delay);
		}

		fnDebounced.clear = () => clearTimeout(timer);

		return fnDebounced;
	},

	easeOut: (time, startVal, change, duration) => change * Math.sin(time / duration * (Math.PI / 2)) + startVal,

	easeIn: (time, startVal, change, duration) => -change * Math.cos(time / duration * (Math.PI / 2)) + change + startVal,

	linear: (time, startVal, change, duration) => change * time / duration + startVal,

	round: (value, decimal) => {
		const power = Math.pow(10, decimal);

		return Math.round(value * power) / power;
	},

	humanizeNumber: (number, unit, preText) => {
		number = Math.floor(number);

		return number < 1 ? 'soon' : `${preText || ''} ${number.toLocaleString()} ${number > 1 ? unit + 's' : unit}`;
	},

	getIconStyle: iconName => {
		iconName = iconName.toLowerCase().replace(/ /g, '-');
		return {'background-image': `url(static/images/icon-${iconName || 'default'}.jpg)`};
	},
};

export default utils;
