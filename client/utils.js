
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

	// Deep equal comparison
	isEqual: (a, b) => {
		if (typeof a !== typeof b) {
			return false;
		}
		if (typeof a !== 'object') {
			return a === b;
		}
		return Object.keys(a).length === Object.keys(b).length && !Object.keys(a).some((key) => {
			return !utils.isEqual(a[key], b[key]);
		});
	},

	// Return random integer between min max values, eg. 12-14'
	getRandom(number) {
		const splitNumber = (number + '').replace(/\s/g, '').split('-');
		const min = +splitNumber[0];
		const max = +splitNumber[1];

		return max ? Math.floor(Math.random() * (max - min + 1) + min) : min;
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
};

export default utils;
