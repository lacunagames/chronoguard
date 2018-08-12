

import utils from 'utils';

const validationRules = {

	required: (field) => {
		return field.value instanceof Array ? field.value.length > 0 : !!field.value;
	},

	minLength: (field, rule) => {
		return !field.value || field.value.length >= rule.minLength;
	},

	matchOption: (field) => {
		return !!field.matchingOption;
	},

	positiveInteger: field => {
		return !field.value || +field.value >= 0 && field.value % 1 === 0;
	},

	unique: (field, rule) => {
		return !field.value || !rule.others.includes(field.value);
	},

	range: field => {
		const val = (field.value + '').replace(/ /g, '');
		const split = val.split('-');
		const invalidRange = isNaN(+split[0]) || isNaN(+split[1]) || +split[0] > +split[1] || +split[0] % 1 > 0 || +split[1] % 1 > 0;
		return !val || !isNaN(+val) || split.length === 2 && !invalidRange;
	}
};

const defaultErrorTexts = {
	required: 'This field is required',
	minLength: 'This field has to be at least {minLength} characters long',
	matchOption: `Please enter a matching value`,
	positiveInteger: `Please enter a positive number, for example: 12`,
	range: `Please enter a number or range, for example: 4 or 3-12`,
	unique: `Please enter a unique value`,
};

export {
	validationRules,
	defaultErrorTexts,
};
