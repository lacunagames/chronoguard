
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

		updateFields() {
			const {optionsData, formMethods, openIndex, fields} = this.props;
			const updateValues = () => {
				const valObj = this.props.values.find(valObj => valObj._index === openIndex);

				let fieldValues = valObj && Object.keys(valObj).filter(name => name[0] !== '_').reduce((obj, fieldName) => {
					const isAutoComplete = fields[fieldName].type === 'autocomplete';

					return obj = {
						...obj,
						[fieldName]:  utils.isObj(valObj[fieldName]) 	? isAutoComplete 	? valObj[fieldName].title
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
				});
			};

			let updateLength = Object.keys(optionsData).length;

			if (updateLength === 0) {
				return updateValues();
			}
			for (let fieldName in optionsData) {
				formMethods.updateOptions(fieldName, optionsData[fieldName], () => {
					updateLength--;
					if (updateLength === 0) {
						updateValues();
					}
				});
			}
		}

		handleFieldChange() {
			const {fields, formMethods, changeValue} = this.props;

			const newValue = Object.keys(fields).reduce((obj, fieldName) => obj = formMethods.isHiddenField(fields[fieldName]) ? obj : {
				...obj,
				[fieldName]: fields[fieldName].matchingOption ||
											fields[fieldName].options && fields[fieldName].options.find(option => option.value === fields[fieldName].value) ||
											fields[fieldName].value,
			}, {});

			for (let fieldName in newValue) {
				if (fields[fieldName].type === 'iconSelect') {
					newValue[fieldName] = {...newValue[fieldName], shape: fields[fieldName].shape.calculated}
				}
			}

			newValue._isValid = formMethods.isValidAll(fields);
			newValue._index = this.props.openIndex;
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
					<input type="submit" className="access" tabindex="-1" />
					{renderForm(this.props.fields)}
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
