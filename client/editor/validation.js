

import utils from 'utils';

const validationRules = {

	required: field => {
		return field.value instanceof Array ? field.value.length > 0 : !!field.value;
	},

	minLength: (field, rule) => {
		return !field.value || field.value.length >= rule.value;
	},

	maxLength: (field, rule) => {
		return !field.value || field.value.length <= rule.value;
	},

	allValidValues: field => {
		return !field.value || !field.value.some(valObj => !valObj._isValid);
	},

	matchOption: (field) => {
		return !!field.matchingOption;
	},

	number: field => {
		return !field.value || !isNaN(+field.value);
	},

	wholeNumber: field => {
		return !field.value || field.value % 1 === 0;
	},

	min: (field, rule) => {
		return !field.value || +field.value >= rule.value;
	},

	max: (field, rule) => {
		return !field.value || +field.value <= rule.value;
	},

	unique: (field, rule) => {
		return !field.value || !rule.others.includes(field.value);
	},

	range: field => {
		const val = (field.value + '').replace(/ /g, '');
		const [s0, s1, ...restSplit] = val.split('-');
		const invalidRange = isNaN(+s0) || +s0 < 0 || isNaN(+s1) || +s0 > +s1 || +s0 % 1 > 0 || +s1 % 1 > 0;

		return !val || !isNaN(+val) && +val >= 0 && +val % 1 === 0 || restSplit.length === 0 && s0.length && !invalidRange;
	},

	rangeMin: (field, rule) => {
		const val = (field.value + '').replace(/ /g, '');
		const [s0] = val.split('-');

		return !val || +s0 >= rule.value;
	},
};

const defaultErrorTexts = {
	required: `This field is required`,
	minLength: `This field has to be at least {value} characters long`,
	maxLength: `This field can't be more than {value} characters long`,
	matchOption: `Please enter a matching value`,
	number: `Please enter a number, for example 3.23`,
	wholeNumber: `Please enter a whole number, for example 3`,
	range: `Please enter a positive whole number or range, for example: 4 or 3-12`,
	rangeMin: `This field value has to be at least {value}`,
	unique: `Please enter a unique value`,
	min: `This field value has to be at least {value}`,
	max: `This field value can't be larger than {value}`,
	allValidValues: 'Invalid values',
};

export {
	validationRules,
	defaultErrorTexts,
};
