

import utils from 'utils';
import {defaultState as worldState} from '../game/world';
import {defaultState as playerState} from '../game/player';

const validConditionNames = Object.keys({...worldState, ...playerState}).map(name => ({
	name,
	hasSubFields: typeof (worldState.hasOwnProperty(name) ? worldState[name] : playerState[name]) === 'object',
}));

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
		const matchingMulticomplete = field.value instanceof Array &&
																		!field.value.some(item => !field.options.find(opt => opt.value === item.value));

		return !!field.matchingOption || matchingMulticomplete;
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
		return !field.value || !rule.others.includes(field.value.toLowerCase().trim());
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

	conditionText: field => {
		const [leftSide, separator, rightSide] = field.value.replace(/(\[|\]\.)/g, '.')
																						.replace(/(\s|\'|\")/g, '')
																						.split(/(>=|>|===|==|<=|<|includes)/);
		const validSide = side => {
			const dotSplit = (side || '').split('.');
			const validNameObj = validConditionNames.find(obj => obj.name === dotSplit[0]);
			const hasSubFields = dotSplit.length > 1;

			return side && !isNaN(+side) || validNameObj && dotSplit[dotSplit.length - 1] && validNameObj.hasSubFields === hasSubFields;
		};
		const validIncludes = () => {
			const leftObj = validConditionNames.find(obj => obj.name === leftSide);

			return separator === 'includes' && leftObj && leftObj.hasSubFields && isNaN(+rightSide) && !rightSide.includes('.');
		}

		 return !field.value || validSide(rightSide) && validSide(leftSide) || validIncludes();
	},
};

const defaultErrorTexts = {
	required: `This field is required`,
	minLength: `This field has to be at least {value} characters long`,
	maxLength: `This field can't be more than {value} characters long`,
	matchOption: `Please select a matching value`,
	number: `Please enter a number, for example 3.23`,
	wholeNumber: `Please enter a whole number, for example 3`,
	range: `Please enter a positive whole number or range, for example: 4 or 3-12`,
	rangeMin: `This field value has to be at least {value}`,
	unique: `Please enter a unique value`,
	min: `This field value has to be at least {value}`,
	max: `This field value can't be larger than {value}`,
	allValidValues: 'Invalid values',
	conditionText: 'Please enter a valid condition, for example maxEnergy >= 34'
};

export {
	validationRules,
	validConditionNames,
	defaultErrorTexts,
};
