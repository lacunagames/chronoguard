
import './multi-add.scss';

import React from 'react';

import utils from 'utils';
import Modal from '../components/modal';
import Tooltip from '../components/tooltip';
import {formWithValidation, Field} from './form';
import multiAddForm from './multi-add-form';


class MultiAdd extends React.Component {

	constructor(props) {
		super(props);
		utils.bindThis(this, ['toggleModal', 'changeValue', 'clickRemove']);
		this.state = {
			isModalOpen: false,
			openIndex: false,
			modalPos: '',
			optionsData: {},
		};
		// Create form in constructor to avoid circular dependency errors
		this.Form = formWithValidation(multiAddForm(this.props.config.renderForm), this.props.config.fields);
	}

	componentWillMount() {
		this.validateOptionFields(this.props.value);
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.value !== this.props.value) {
			this.validateOptionFields(nextProps.value);
		}
	}

	validateOptionFields(value) {
		setTimeout(() => {
			const {getOptionsData, data} = this.props.config;
			const newValues = [];

			for (let fieldName in getOptionsData) {
				value.forEach((valObj, index) => {
					const allOptions = getOptionsData[fieldName](data, []);
					if (typeof valObj[fieldName] === 'object') {
						const optionValue = allOptions.find(optObj => optObj.value === valObj[fieldName].value);

						if (!utils.isEqual(valObj[fieldName], optionValue)) {
							newValues.push({
								...valObj,
								[fieldName]: optionValue || valObj[fieldName].title,
								_isValid: !!optionValue && valObj._isValid,
							});
						} else if (typeof valObj[fieldName] === 'string') {
							const optionValue = utils.pickWild(allOptions, 'title', valObj[fieldName].trim().toLowerCase());

							optionValue && newValues.push({...valObj, [fieldName]: optionValue, _isValid: true});
						}
					}
				});
			}
			newValues.length && this.changeValue(newValues);
		}, 0);
	}

	toggleModal(e, index, focusField) {
		const {getOptionsData, data} = this.props.config;
		const openIndex = index || Math.max(...this.props.value.map(valObj => valObj._index), 0) + 1;

		e && e.stopPropagation();

		if (this.state.isModalOpen) {
			this.setState({isModalOpen: false});

		} else {
			this.setState({
				isModalOpen: true,
				modalPos: e.currentTarget.getBoundingClientRect(),
				openIndex,
				focusField,
				optionsData: Object.keys(getOptionsData || {}).reduce((obj, fieldName) => {
					const values = this.props.value.filter(valObj => valObj._index !== openIndex).map(valObj => {
						return typeof valObj[fieldName] === 'object' ? valObj[fieldName].value : valObj[fieldName];
					});

					return obj = {...obj, [fieldName]: getOptionsData[fieldName](data, values)};
				}, {}),
			});
		}
	}

	changeValue(value) {
		const newValueMultiple = value instanceof Array ? value : [value];
		let newValues = [...this.props.value];

		newValueMultiple.forEach(newValue => {
			const index = newValues.findIndex(valObj => valObj._index === newValue._index);
			const isRemove = newValue._remove || !Object.keys(newValue).filter(name => name[0] !== '_').some(name => newValue[name]);

				newValues = isRemove ? newValues.filter(valObj => valObj._index !== newValue._index)
														 : index === -1 ? [...newValues, newValue].sort((valObjA, valObjB) => valObjA._index - valObjB._index)
																						: [...newValues.slice(0, index), newValue, ...newValues.slice(index + 1)];

		});

		this.props.onChange({target: {value: newValues}});
	}

	clickRemove(e, index) {
		e.stopPropagation();
		this.changeValue({_remove: true, _index: index});
	}

	render() {
		const valueButtons = this.props.value.map(valObj => {
			const valueText = Object.keys(valObj).filter(fieldName => fieldName[0] !== '_').map(fieldName => {
				const displayConfig = this.props.config.display[fieldName] || {};
				const displayText = (displayConfig.pre || '') +
					(typeof valObj[fieldName] === 'string' && (valObj[fieldName] || '??') || '') +
					(typeof valObj[fieldName] === 'object' && (valObj[fieldName].title || valObj[fieldName].value) || '') +
					(displayConfig.post || '');

				return <span onClick={e => this.toggleModal(e, valObj._index, fieldName)}>
					{typeof valObj[fieldName] === 'object' && valObj[fieldName].icon && displayConfig.type !== 'icon' &&
						<span class={`auto-icon ${valObj[fieldName].iconStyle || ''}`}>
							<span style={utils.getIconStyle(valObj[fieldName].icon)} />
						</span>
					}
					{displayConfig.type === 'icon' &&
						<Tooltip show={this.state[`tooltipIcon${valObj._index}`]}
							toggleTooltip={isOpen => this.setState({[`tooltipIcon${valObj._index}`]: isOpen})}>
							<span class={`auto-icon no-text ${valObj[fieldName].iconStyle || ''}`}>
								<span style={utils.getIconStyle(valObj[fieldName].icon)} />
							</span>
							<p>{displayText}</p>
						</Tooltip>
					}
					{(displayConfig.type === 'text' || typeof displayConfig.type === 'undefined') && displayText}
				</span>
			});

			valueText.push(<span className="remove" onClick={e => this.clickRemove(e, valObj._index)}><i>close</i></span>);

			return <button type="button"
				className={`multi-button ${!valObj._isValid && 'invalid'}`}
				onClick={e => this.toggleModal(e, valObj._index)}>
				{valueText}
			</button>
		});
		const {maxLength, value, label} = this.props;
		const {getOptionsData, uniqueOptionField, data} = this.props.config;
		let remaining = true;

		if (getOptionsData && getOptionsData[uniqueOptionField]) {
			const values = value.map(valObj => valObj[uniqueOptionField].value);

			remaining = getOptionsData[uniqueOptionField](data, values).length > 0;
		}

		return (
			<div className="multi-add">
				{valueButtons}
				{(remaining && (!maxLength || maxLength > value.length)) &&
					<button type="button" className="icon-raised add-new" onClick={this.toggleModal}><i>add</i></button>
				}
				<Modal show={this.state.isModalOpen}
					// pos={this.state.modalPos}
					locked={false}
					className="multi-add-modal"
					onClose={this.toggleModal}>
					<h3 data-modal-head>{label}</h3>
					<this.Form
						values={value}
						isModalOpen={this.state.isModalOpen}
						openIndex={this.state.openIndex}
						optionsData={this.state.optionsData}
						changeValue={this.changeValue}
						focusField={this.state.focusField}
						toggleModal={this.toggleModal} />
				</Modal>
			</div>
		);
	}
}

export default MultiAdd;
