
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
		utils.bindThis(this, ['toggleModal', 'changeValue', 'clickRemove', 'dragStartMultiButton']);
		this.state = {
			isModalOpen: false,
			openIndex: false,
			modalPos: '',
			optionsData: {},
			draggedIndex: -1,
			moveDragBefore: -1,
			moveDragAfter: -1,
		};
		this.dragButtons = [];
		this.extended = Object.keys(this.props.config.fields).find(name => this.props.config.fields[name].type === 'multiAdd');
		// Create form in constructor to avoid circular dependency errors
		this.Form = formWithValidation(multiAddForm(this.props.config.renderForm), this.props.config.fields);
	}

	componentWillMount() {
		this.validateOptionFields(this.props.value);
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.value !== this.props.value) {
			this.validateOptionFields(nextProps.value);
			typeof this.state.modalPos === 'object' && this.setState({modalPos: {...this.state.modalPos}});
		}
	}

	componentWillUnmount() {
		clearTimeout(this.dragTimer);
	}

	validateOptionFields(value) {
		setTimeout(() => {
			const {getOptionsData, data} = this.props.config;
			const newValues = [];

			for (let fieldName in getOptionsData) {
				value.forEach((valObj, index) => {
					const allOptions = getOptionsData[fieldName](data, []);
					if (typeof valObj[fieldName] === 'object') {
						const isObj = utils.isObj(valObj[fieldName]);
						const values = isObj ? [valObj[fieldName]] : valObj[fieldName];
						const newValArray = [];
						let isValid = valObj._isValid;

						values.forEach((oldValObj, index) => {
							const optionValue = allOptions.find(optObj => optObj.value === oldValObj.value);

							if (!utils.isEqual(oldValObj, optionValue)) {
								newValArray[index] = optionValue || oldValObj.title;
								isValid = isValid && !!optionValue;
							} else if (typeof oldValObj === 'string') {
								const optionValue = utils.pickWild(allOptions, 'title', oldValObj.trim().toLowerCase());
								newValArray[index] = optionValue;
								isValid = isValid && !!optionValue;
							}
						});

						if (newValArray.filter(val => val).length) {
							const newVal = isObj ? {...newValArray[0]} : valObj[fieldName].map((val, index) => newValArray[index] || val);

							newValues.push({
								...valObj,
								[fieldName]: newVal,
								_isValid: isValid,
							});
						} else if (isValid !== valObj._isValid) {
							newValues.push({
								...valObj,
								_isValid: isValid,
							});
						}
					}
				});
			}
			newValues.length && this.changeValue(newValues);
		}, 0);
	}

	toggleModal(e, index, focusField) {
		const {getOptionsData, data, fields} = this.props.config;
		const openIndex = index || Math.max(...this.props.value.map(valObj => valObj._index), 0) + 1;

		e && e.stopPropagation();

		if (this.state.isModalOpen) {
			this.setState({isModalOpen: false});

		} else {
			const {top, bottom, left, right} = e.currentTarget.getBoundingClientRect();

			// Update unique rule others array
			for (let fieldName in fields) {
				const uniqueRule = fields[fieldName].rules.find(rule => rule.type === 'unique');

				if (uniqueRule) {
					const value = this.props.value;

					uniqueRule.others = value.filter(valObj => value.indexOf(valObj) + 1 !== openIndex)
																		.map(valObj => valObj[fieldName].toLowerCase().trim());
				}
			}


			// Generate value on new item
			const generatedValues = {};
			if (openIndex > this.props.value.length) {
				for (let fieldName in fields) {
					if (fields[fieldName].generateValue) {
						generatedValues[fieldName] = fields[fieldName].generateValue(this.props.config);
					}
				}
			}

			this.setState({
				isModalOpen: true,
				modalPos: typeof top !== 'undefined' && {top, bottom, left, right},
				openIndex,
				focusField,
				generatedValues,
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

	dragStartMultiButton(e, index) {
		if (this.extended) {
			return;
		}
		const dragClone = this.dragButtons[index].cloneNode(true);
		const buttonBox = this.dragButtons[index].getBoundingClientRect();
		const offsetX = buttonBox.left - (e.touches ? e.touches[0].clientX : e.clientX);
		const offsetY = buttonBox.top - (e.touches ? e.touches[0].clientY : e.clientY);
		let dragging = false;
		const hasMoved = e => {
			const xMove = buttonBox.left - (e.touches ? e.touches[0].clientX : e.clientX) - offsetX;
			const yMove = buttonBox.top - (e.touches ? e.touches[0].clientY : e.clientY) - offsetY;

			return Math.abs(xMove) + Math.abs(yMove) > 10;
		}

		const dragUpdate = e => {
			if (['mouseup', 'touchend', 'click'].includes(e.type)) {
				dragClone.remove();
				utils.offEvent(window, 'mousemove mouseup touchmove touchend click', dragUpdate);

				const moveToIndex = this.state.moveDragBefore > index ? this.state.moveDragBefore - 1 : this.state.moveDragBefore;
				this.setState({draggedIndex: -1, moveDragBefore: -1, moveDragAfter: -1}, () => {
					if (moveToIndex >= 0 && moveToIndex !== index) {
						const newValues = [...this.props.value];
						newValues.splice(index, 1);
						newValues.splice(moveToIndex, 0, this.props.value[index]);
						this.props.onChange({target: {value: newValues}});
					}
				});

			} else if (!dragging && ['mousemove', 'touchmove'].includes(e.type) && hasMoved(e)) {
				dragClone.className += ' clone';
				document.body.querySelector('.screen').appendChild(dragClone);
				this.setState({draggedIndex: index});
				dragging = true;
			}
			if (dragging && ['mousemove', 'touchmove'].includes(e.type)) {
				const x = (e.touches ? e.touches[0].clientX : e.clientX);
				const y = (e.touches ? e.touches[0].clientY : e.clientY);
				const getSide = box => {
					const inside = box.left <= x && box.right >= x && box.top <= y && box.bottom >= y;
					return inside ? x <= box.left + box.width / 2 ? 'left' : 'right'
												: false;
				};

				this.dragButtons.some((button, matchIndex) => {
					const side = getSide(button.getBoundingClientRect());

					if (side) {
						let moveDragAfter, moveDragBefore;

						moveDragAfter = side === 'left' ? matchIndex - 1 : matchIndex;
						moveDragAfter = moveDragAfter === index ? index - 1 : moveDragAfter;
						moveDragBefore = side === 'left' ? matchIndex : matchIndex + 1;
						moveDragBefore = moveDragBefore === index ? index + 1 : moveDragBefore;

						this.setState({moveDragAfter, moveDragBefore});
						return true;
					}
				});

				dragClone.style.left = `${x + offsetX}px`;
				dragClone.style.top = `${y + offsetY}px`;
			}
		};

		utils.onEvent(window, 'mousemove mouseup touchmove touchend click', dragUpdate);
	}

	render() {
		const valueButtons = this.props.value.map((valObj, index) => {
			const valueText = Object.keys(valObj).filter(fieldName => {
				const hasValue = utils.isObj(valObj[fieldName]) ? valObj[fieldName].value
																												: valObj[fieldName] instanceof Array 	? valObj[fieldName].length
																																															: valObj[fieldName];
				const hiddenType = (this.props.config.display[fieldName] || {}).type === 'hidden';
				const multiAdd = (this.props.config.fields[fieldName] || {}).type === 'multiAdd';

				return fieldName[0] !== '_' && (!valObj._isValid || hasValue) && !hiddenType && !multiAdd;
			}).sort((aName, bName) => {
				return this.props.config.display.sort ? this.props.config.display.sort.indexOf(aName) - this.props.config.display.sort.indexOf(bName)
																							: false
			}).map(fieldName => {
				const displayConfig = this.props.config.display[fieldName] || {};
				const displayText = (
					<span>
						{displayConfig.pre || ''}
						{valObj[fieldName] instanceof Array && (valObj[fieldName].length > 0 && valObj[fieldName].map(item => {
							return (
								<span className="multi-val">
									{item.icon &&
										<span className={`auto-icon ${item.shape || ''}`}>
											<span style={utils.getIconStyle(item.icon)} />
										</span>
									}
									{item.title || item.value}
								</span>
							);
						}) || '??')}
						{displayConfig.type !== 'iconText' && typeof valObj[fieldName] === 'string' && (valObj[fieldName] || '??') || ''}
						{displayConfig.type !== 'iconText' && typeof valObj[fieldName] === 'object' && (valObj[fieldName].title || valObj[fieldName].value) || ''}
						{displayConfig.post || ''}
					</span>
				);

				return <span
					onClick={e => this.toggleModal(e, valObj._index, fieldName)}
					className={displayConfig.type === 'icon' ? 'no-text' : ''}>
					{typeof valObj[fieldName] === 'object' && valObj[fieldName].icon && displayConfig.type !== 'icon' &&
						<span className={`auto-icon ${valObj[fieldName].shape || ''} ${displayConfig.type === 'iconText' && 'icon-no-text'}`}>
							<span style={utils.getIconStyle(valObj[fieldName].icon)} />
						</span>
					}
					{displayConfig.type === 'icon' && valObj[fieldName] &&
						<Tooltip show={this.state[`tooltipIcon${valObj._index}`]}
							toggleTooltip={isOpen => this.setState({[`tooltipIcon${valObj._index}`]: isOpen})}>
							<span className={`auto-icon ${valObj[fieldName].shape || ''}`}>
								<span style={utils.getIconStyle(valObj[fieldName].icon)} />
							</span>
							<p>{displayText}</p>
						</Tooltip>
					}
					{(displayConfig.type === 'text' || typeof displayConfig.type === 'undefined') &&
						<span>
							{displayText}
						</span>
					}
				</span>
			});

			const invalidNormalPart = valObj._invalids && valObj._invalids.filter(name => name !== this.extended).length > 0;

			!this.extended && valueText.push(
				<span className="remove" onClick={e => this.clickRemove(e, valObj._index)}><i>close</i></span>
			);

			return (
				<div className={utils.getClassName({'value-wrap': this.extended})}>
					<button type="button"
						className={utils.getClassName({
							'multi-button' : true,
							'multi-button-extended' : this.extended,
							invalid: this.extended ? invalidNormalPart : !valObj._isValid,
							dragged: index === this.state.draggedIndex,
							'drag-before': index === this.state.moveDragBefore,
							'drag-after': index === this.state.moveDragAfter,
						})}
						ref={el => this.dragButtons[index] = el}
						onMouseDown={e => this.dragStartMultiButton(e, index)}
						onTouchStart={e => this.dragStartMultiButton(e, index)}
						onClick={e => this.toggleModal(e, valObj._index)}>
						{valueText}
					</button>
					{this.extended &&
						<button className="remove-extended icon" onClick={e => this.clickRemove(e, valObj._index)}><i>close</i></button>
					}
					{this.extended &&
						<this.Form
							values={this.props.value}
							openIndex={this.state.openIndex}
							optionsData={this.state.optionsData}
							changeValue={this.changeValue}
							focusField={this.state.focusField}
							generatedValues={this.state.generatedValues} />
					}
				</div>
			);
		});
		const {maxLength, value, label} = this.props;
		const {getOptionsData, uniqueOptionField, data} = this.props.config;
		let remaining = true;

		if (getOptionsData && getOptionsData[uniqueOptionField]) {
			const values = value.map(valObj => valObj[uniqueOptionField].value);

			remaining = getOptionsData[uniqueOptionField](data, values).length > 0;
		}

		return (
			<div className={utils.getClassName({'multi-add': true, extended: this.extended})}>
				{valueButtons}
				{(remaining && (!maxLength || maxLength > value.length)) &&
					<div>
						<button type="button"
							className={`icon-raised add-new${this.state.moveDragBefore === value.length ? ' drag-before' : ''}`}
							onClick={this.toggleModal}>
							<i>add</i>
						</button>
					</div>
				}
				<Modal show={this.state.isModalOpen}
					locked={false}
					className={utils.getClassName({'multi-add-modal': true, 'extended-modal': this.extended})}
					onClose={this.toggleModal}>
					<h3 data-modal-head>{label}</h3>
					<this.Form
						values={value}
						isModalOpen={this.state.isModalOpen}
						openIndex={this.state.openIndex}
						optionsData={this.state.optionsData}
						changeValue={this.changeValue}
						focusField={this.state.focusField}
						toggleModal={this.toggleModal}
						generatedValues={this.state.generatedValues} />
				</Modal>
			</div>
		);
	}
}

export default MultiAdd;
