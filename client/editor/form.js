
import './form.scss';

import React from 'react';

import utils from 'utils';
import { validationRules, defaultErrorTexts } from './validation';
import Field from './field';
import ErrorSummary from './error-summary';

const formWithValidation = (FormComponent, fieldsConfig) => {

	class FormWithValidation extends React.Component {

		constructor(props) {
			super(props);
			utils.bindThis(this, [
				'fieldChange',
				'isValidAll',
				'validateAll',
				'clearValidity',
				'isValidityChange',
				'subscribeValidityChange',
				'isHiddenField',
				'updateFields',
				'updateOptions',
				'subscribeFieldChange',
			]);
			this.state = fieldsConfig;
			this.fillState();
			this.oldValid = undefined;
			this.pendingFields = [];
			this.subscribedValidityFn = [];
			this.subscribedChangeFn = [];

			this.formMethods = {
				checkValidity: this.checkValidity,
				isValidAll: this.isValidAll,
				validateAll: this.validateAll,
				clearValidity: this.clearValidity,
				onValidityChange: this.subscribeValidityChange,
				onFieldChange: this.subscribeFieldChange,
				updateFields: this.updateFields,
				updateOptions: this.updateOptions,
				isHiddenField: this.isHiddenField,
			};

		}

		fillState() {
			Object.keys(this.state).forEach((fieldName) => {
				const field = this.state[fieldName];

				if (field.rules) {
					field.rules.forEach((rule) => {
						if (!rule.errorText) {
							let text = defaultErrorTexts[rule.type] || '';

							text = text.replace(/{(minLength|value)}/g, rule.minLength || rule.value);
							rule.errorText = text;
						}
					});
				}
				field.isHidden = this.isHiddenField(field);
				field.disabled = this.isDisabledField(field);

				// Add asterisk to mark required for select
				if ((field.type === 'select' || field.type === 'autocomplete') && field.rules.find(rule => rule.type === 'required')) {
					const emptyOption = field.options.find(option => option.value === '' && option.title[option.title.length - 1] !== '*');

					(emptyOption || {}).title += ' *';
				}
				if (field.type === 'autocomplete') {
					field.matchingOption = utils.pickWild(field.options, 'title', field.value);
					if (field.dynamicHelpText) {
						field.helpText = field.matchingOption ? field.dynamicHelpText(field) : '';
					}
				}
				if (typeof field.shape === 'object') {
					field.shape.origin = this;
				}
				// Add change handler
				field.onChange = (e) => {
					this.fieldChange(fieldName, e);
				};
			});
		}

		fieldChange(fieldName, e, callback) {
			const cloneField = {...this.state[fieldName]};
			const skipValidate = e.type === 'change'
															&& ['text', 'autocomplete', 'multiAdd'].includes(cloneField.type)
															&& typeof cloneField.invalid === 'undefined';

			switch (cloneField.type) {
				case 'checkbox':
					cloneField.value = e.target.checked === false ? '' : e.target.value;
					break;

				case 'checkboxGroup':
					const valuesArr = cloneField.value.length ? cloneField.value.split(', ') : [];

					switch (e.target.checked) {
						case true:
							valuesArr.push(e.target.value); break;
						case false:
							valuesArr.splice(valuesArr.indexOf(e.target.value), 1); break;
					}
					cloneField.value = valuesArr.join(', ');
					break;

				case 'autocomplete':
				case 'select':
				case 'iconSelect':
					cloneField.value = e.target.value;
					cloneField.options = e.options || cloneField.options;
					cloneField.matchingOption = e.matchingOption ||
						utils.pickWild(cloneField.options, cloneField.type === 'autocomplete' ? 'title' : 'value', cloneField.value);
					if (cloneField.dynamicHelpText) {
						cloneField.helpText = cloneField.matchingOption ? cloneField.dynamicHelpText(cloneField) : '';
					}
					break;

				default:
					cloneField.value = e.target.value;
			}
			cloneField.isHidden = this.isHiddenField(cloneField);
			cloneField.disabled = this.isDisabledField(cloneField);
			if (!skipValidate) {
				cloneField.invalid = this.checkValidity(cloneField);
			}

			this.setState({[fieldName]: cloneField}, () => {
				const pendingIndex = this.pendingFields.indexOf(fieldName);

				if (pendingIndex > -1) {
					this.pendingFields.splice(pendingIndex, 1);
				}

				if (cloneField.validateOnChange) {
					const fieldsToValidate = {};

					cloneField.validateOnChange.forEach(fieldName => {
						!this.pendingFields.includes(fieldName) && this.pendingFields.push(fieldName);
						fieldsToValidate[fieldName] = this.state[fieldName];
					});
					this.validateAll(fieldsToValidate);
				}
				const fieldsToUpdate = Object.keys(this.state).filter(matchName => {
					const hidden = this.state[matchName].hidden;
					const update = this.state[matchName].updateWhenChanged;
					const hiddenMatch = hidden instanceof Array ? hidden.find(item => item.field === fieldName)
																											: (hidden || {}).field === fieldName;
					const updateMatch = update instanceof Array ? update.find(item => item === fieldName) : update === fieldName;

					return hiddenMatch || updateMatch;
				}).reduce((obj, name) => obj = {...obj, [name]: this.state[name].value}, {});
				const hasFieldsToUpdate = Object.keys(fieldsToUpdate).length > 0;

				hasFieldsToUpdate && this.updateFields(fieldsToUpdate, () => {
					Object.keys(fieldsToUpdate).forEach(fieldName => this.pendingFields.splice(this.pendingFields.indexOf(fieldName), 1));
					if (this.pendingFields.length === 0) {
						callback ? callback() : this.isValidityChange();
					}
					this.subscribedChangeFn.forEach(fn => fn(fieldName, cloneField));
				});

				if (this.pendingFields.length === 0) {
					callback ? callback() : this.isValidityChange();
				}
				!hasFieldsToUpdate && this.subscribedChangeFn.forEach(fn => fn(fieldName, cloneField));
			});
			return cloneField;
		}

		isHiddenField(field) {
			if (!field.hidden) {
				return false;
			}

			let isHidden = false;
			const items = field.hidden instanceof Array ? field.hidden : [field.hidden];

			items.some(item => {
				const matchValue = this.state[item.field].value;
				const {fieldValue, fieldValueNot} = item;

				if (fieldValue !== undefined) {
					isHidden = typeof fieldValue === 'object' ? fieldValue.indexOf(matchValue) > -1 : fieldValue === matchValue;
				}
				if (fieldValueNot !== undefined && !isHidden) {
					isHidden = typeof fieldValueNot === 'object' ? fieldValueNot.indexOf(matchValue) === -1 : fieldValueNot !== matchValue;
				}
				return isHidden;
			});
			return isHidden;
		}

		isDisabledField(field) {
			if (!field.isDisabled) {
				return field.disabled || false;
			}

			let isDisabled = false;
			const items = field.isDisabled instanceof Array ? field.isDisabled : [field.isDisabled];

			items.some(item => {
				const matchValue = this.state[item.field].value;
				const {fieldValue, fieldValueNot} = item;

				if (fieldValue !== undefined) {
					isDisabled = typeof fieldValue === 'object' ? fieldValue.indexOf(matchValue) > -1 : fieldValue === matchValue;
				}
				if (fieldValueNot !== undefined && !isDisabled) {
					isDisabled = typeof fieldValueNot === 'object' ? fieldValueNot.indexOf(matchValue) === -1 : fieldValueNot !== matchValue;
				}
				return isDisabled;
			});
			return isDisabled;
		}

		checkValidity(field) {
			const rules = field.rules || [];

			if (field.isHidden) {
				return '';
			}
			for (let i = 0; i < rules.length; i++) {
				if (!validationRules[rules[i].type](field, rules[i])) {
					return rules[i].type;
				}
			}
			return '';
		}

		isValidAll(fields) {
			for (let fieldName in fields) {
				if (this.checkValidity(fields[fieldName])) {
					return false;
				}
			}
			return true;
		}

		validateAll(fields) {
			const invalids = [];

			for (let fieldName in fields) {
				const field = fields[fieldName];
				const e = {target: {value: field.value}};
				const cloneField = this.fieldChange(fieldName, e);

				if (cloneField.invalid) {
					invalids.push(cloneField);
				}
			}
			return invalids;
		}

		clearValidity(fields) {
			for (let fieldName in fields) {
				const cloneField = Object.assign({}, fields[fieldName]);

				cloneField.invalid = undefined;
				this.setState({[fieldName]: cloneField});
			}
			this.oldValid = undefined;
		}

		isValidityChange() {
			const newValid = this.isValidAll(this.state);

			if (newValid !== this.oldValid) {
				this.oldValid = newValid;
				this.subscribedValidityFn.forEach(fn => fn(newValid));
			}
		}

		subscribeValidityChange(fn) {
			this.subscribedValidityFn.push(fn);
		}

		subscribeFieldChange(fn) {
			this.subscribedChangeFn.push(fn);
		}

		updateFields(fields, callback, triggerChange) {
			const fieldNames = Object.keys(fields).filter(fieldName => this.state.hasOwnProperty(fieldName));
			let counter = fieldNames.length;

			if (triggerChange) {
				fieldNames.forEach(fieldName => this.fieldChange(fieldName, {target: {value: fields[fieldName]}}), () => {
					counter--;
					if (counter === 0) {
						callback();
					}
				});
			}

			let updatedCount = 0;
			const updateAll = (type, callbackFn) => {
				fieldNames.forEach((fieldName) => {
					let setTo;
					switch (type) {
						case 'value': setTo = fields[fieldName]; break;
						case 'isHidden': setTo = this.isHiddenField(this.state[fieldName]); break;
						case 'disabled': setTo = this.isDisabledField(this.state[fieldName]); break;
					}
					const updatedField = {...this.state[fieldName], [type]: setTo};

					if (type === 'value' && ['autocomplete', 'select'].includes(updatedField.type)) {
						updatedField.matchingOption = utils.pickWild(updatedField.options, updatedField.type === 'autocomplete' ? 'title' : 'value', updatedField.value);
						if (updatedField.dynamicHelpText) {
							updatedField.helpText = updatedField.matchingOption ? updatedField.dynamicHelpText(updatedField) : '';
						}
					}
					this.setState({[fieldName]: updatedField}, () => {
						updatedCount++;
						if (callbackFn && updatedCount === fieldNames.length) {
							updatedCount = 0;
							callbackFn();
						}
					});
				});
			};

			if (fieldNames.length === 0) {
				return callback && callback();
			}
			updateAll('value', () => updateAll('isHidden', () => updateAll('disabled', callback)));
		}

		updateOptions(fieldName, newOptions, callback) {
			const field = {...this.state[fieldName]};
			const isMulticomplete = field.type === 'multicomplete';
			const matchingOption = !isMulticomplete &&
							utils.pickWild(newOptions, 'value', field.matchingOption ? field.matchingOption.value : field.value);
			const value = isMulticomplete ? field.value : matchingOption && matchingOption.title || '';

			this.setState({[fieldName]: {
				...field,
				options: newOptions,
				value,
				matchingOption,
			}}, callback);
		}

		render() {
			return (
				<FormComponent formMethods={this.formMethods} fields={this.state} {...this.props} />
			);
		}
	}

	return FormWithValidation;
};

export {
	Field,
	formWithValidation,
	ErrorSummary,
}
