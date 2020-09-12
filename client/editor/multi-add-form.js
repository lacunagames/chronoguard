
import React from 'react';

import utils from 'utils';

const multiAddForm = (renderForm) => {

	class MultiAddForm extends React.Component {

		constructor(props) {
			super(props);
			utils.bindThis(this, ['handleFieldChange', 'formAction', 'removeAction']);
			this.updateFields();
			this.props.formMethods.onFieldChange(this.handleFieldChange);
		}

		isAllowedField(name) {
			const {fields, onlyMultiAdd, noMultiAdd} = this.props;
			const isMultiAdd = fields[name] && fields[name].type === 'multiAdd';

			return onlyMultiAdd && isMultiAdd || noMultiAdd && !isMultiAdd || !noMultiAdd && !onlyMultiAdd;
		}

		updateFields() {
			const {optionsData, formMethods, openIndex, fields} = this.props;
			const updateValues = () => {
				const valObj = this.props.values.find(valObj => valObj._index === openIndex);

				let fieldValues = valObj && Object.keys(valObj)
														.filter(name => {
															return name[0] !== '_' && this.isAllowedField(name);
														}).reduce((obj, fieldName) => {
															const isAutoComplete = fields[fieldName] && fields[fieldName].type === 'autocomplete';

															return obj = {
																...obj,
																[fieldName]: utils.isObj(valObj[fieldName])	? isAutoComplete 	? valObj[fieldName].title
																																															: valObj[fieldName].value
																																						: valObj[fieldName],
															};
														}, {});

				for (let fieldName in this.props.generatedValues) {
					fieldValues = fieldValues || {};
					fieldValues[fieldName] = this.props.generatedValues[fieldName];
				}
				fieldValues && formMethods.updateFields(fieldValues, () => {
					const focusElem = this.props.focusField && document.querySelector(`#${this.props.fields[this.props.focusField].id}`);

					if (focusElem) {
						['select', 'iconSelect'].includes(this.props.fields[this.props.focusField].type) ? focusElem.click() : focusElem.focus();
					}
					if (valObj) {
						const allowedFields = Object.keys(this.props.fields)
														.filter(name => this.isAllowedField(name))
														.reduce((obj, name) => obj = {
															...obj,
															[name]: this.props.fields[name],
														}, {});

						this.props.formMethods.validateAll(allowedFields);
					}
				});
			};

			const allowedOptionsData = Object.keys(optionsData)
																		.filter(name => this.isAllowedField(name))
																		.reduce((obj, name) => obj = {...obj, [name]: optionsData[name]}, {});
			let updateLength = Object.keys(allowedOptionsData).length;

			if (updateLength === 0) {
				return updateValues();
			}
			for (let fieldName in allowedOptionsData) {
				formMethods.updateOptions(fieldName, allowedOptionsData[fieldName], () => {
					updateLength--;
					if (updateLength === 0) {
						updateValues();
					}
				});
			}
		}

		handleFieldChange() {
			const {fields, formMethods, changeValue} = this.props;
			const valObj = this.props.values.find(obj => obj._index === this.props.openIndex);
			const getValue = (obj, fieldName) => {

				return {
					...obj,
					[fieldName]: fields[fieldName].matchingOption ||
												(fields[fieldName].options || []).find(option => option.value === fields[fieldName].value) ||
												!this.isAllowedField(fieldName) && valObj && valObj[fieldName] ||
												fields[fieldName].value,
				};
			}

			let newValue = Object.keys(fields).reduce((obj, fieldName) => {
				return obj = formMethods.isHiddenField(fields[fieldName]) ? obj : getValue(obj, fieldName);
			}, {});

			for (let fieldName in newValue) {
				if (fields[fieldName].type === 'iconSelect') {
					newValue[fieldName] = {...newValue[fieldName], shape: fields[fieldName].shape.calculated}
				}
			}

			const allowedFields = Object.keys(fields)
															.filter(name => this.isAllowedField(name))
															.reduce((obj, name) => obj = {...obj, [name]: fields[name]}, {});

			newValue._invalids = [
				...((valObj || {})._invalids || []).filter(name => !Object.keys(allowedFields).includes(name)),
				...formMethods.getInvalids(allowedFields),
			];
			newValue._isValid = newValue._invalids.length === 0;
			newValue._index = this.props.openIndex;
			if (valObj) {
				const otherValues = Object.keys(valObj)
															.filter(name => !Object.keys(allowedFields).includes(name))
															.reduce((obj, name) => obj = {...obj, [name]: valObj[name]}, {});

				newValue = {...otherValues, ...newValue};
			}
			changeValue(newValue);
		}

		formAction(e) {
			const invalids = this.props.formMethods.validateAll(this.props.fields);

			e.preventDefault();
			if (invalids.length === 0) {
				this.props.toggleModal();
			}
		}

		removeAction() {
			this.props.changeValue({_remove: true, _index: this.props.openIndex});
			this.props.toggleModal();
		}

		render() {
			const hasValue = Object.keys(this.props.fields).some(fieldName => this.props.fields[fieldName].value);

			return (
				<form onSubmit={this.formAction}>
					<input type="submit" className="access" tabIndex="-1" />
					{renderForm(this.props.fields, this.props)}
					<div className="row-buttons">
						{hasValue &&
							<button type="button" className="error" onClick={this.removeAction}>Remove</button>
						}
					</div>
				</form>
			);
		}
	}

	return MultiAddForm;
}

export default multiAddForm;
