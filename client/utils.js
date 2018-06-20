
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
};

export default utils;
