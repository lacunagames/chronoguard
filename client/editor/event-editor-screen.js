
import './editor-screen.scss';

import React from 'react';

import Screen from '../components/screen';
import utils from 'utils';
import Editor from './editor';
import {formWithValidation, Field} from './form';
import Tooltip from '../components/tooltip';
import Modal from '../components/modal';
import {actionFieldConfig, eventFields} from './editor-screen-fields';
import TitleMenu from './title-menu';
import {actionTypes} from '../game/world';

const defaultNewEvent = {
	icon: 'default',
	energy: 5,
	duration: 5,
	behaviour: 'pop',
	...actionTypes.reduce((obj, actionType) => obj = {...obj, [`${actionType}Editor`]: []}, {}),
	progressIncreaseEditor: [],
};

class EventEditorScreen extends React.Component {

	constructor(props) {
		super(props);
		utils.bindThis(this, [
			'dataChange',
			'createNewEvent',
			'toggleTooltip',
			'handleFieldChange',
			'validateFields',
			'removeEvent',
		]);

		this.state = {
			createNewEventTooltip: false,
			events: {},
			saving: undefined,
			isValidAll: true,
		};
		this.data = {};
		this.loadCallbacks = [];
		this.newEvents = {};
		this.editor = new Editor(this.dataChange);
		this.props.formMethods.onFieldChange(this.handleFieldChange);
		this.props.formMethods.onValidityChange(isValidAll => {
			const options = [...this.props.fields.selectEvent.options];
			const matchingOption = this.props.fields.selectEvent.matchingOption;
			const index = options.findIndex(option => matchingOption && option.value === matchingOption.value);

			this.setState({isValidAll});
			options[index] = {...options[index], valid: isValidAll};
			this.props.formMethods.updateOptions('selectEvent', options);
		});
	}

	componentWillUnmout() {
		clearTimeout(this.loadTimer);
	}

	handleFieldChange(fieldName, field) {
		const event = this.state.events[(this.props.fields.selectEvent.matchingOption || {}).value];
		if (!this.props.fields.selectEvent.matchingOption) {
			return this.setState({isValidAll: true});
		}
		const eventType = this.props.fields.selectEvent.matchingOption.value;
		if (fieldName === 'selectEvent') {
			localStorage.currentEvent = eventType;
			this.props.formMethods.updateFields({
				eventTitle: event.title,
				eventDuration: event.duration,
				behaviour: event.behaviour,
				eventDesc: event.desc || '',
				eventIcon: event.icon,
				energyCost: event.energy || '',
				progress: event.progress || '',
				location: event.location || 'any',
				posX: event.fixedPosX || '100',
				posY: event.fixedPosY || '100',
				offsetX: event.offsetX || '',
				offsetY: event.offsetY || '',
				range: event.range || '',
				progressIncrease: event.progressIncreaseEditor,
				...actionTypes.reduce((obj, actionType) => obj = {...obj, [actionType]: event[`${actionType}Editor`]}, {}),
			}, () => {
				const uniqueRule = this.props.fields.eventTitle.rules.find(rule => rule.type === 'unique');
				uniqueRule.others = Object.keys(this.state.events)
															.filter(name => name !== eventType && event.title.length >= 3)
															.map(name => this.state.events[name].title.toLowerCase().trim());
				this.setState({saving: undefined, isValidAll: this.props.formMethods.isValidAll(this.props.fields)}, () => {
					const {selectEvent, ...otherFields} = this.props.fields;
					this.props.formMethods.clearValidity(otherFields);
				});
			}, true);
		} else if (event[field.propOrig || fieldName] !== field.value) {
			const eventUpdate = {...event, [field.propOrig || fieldName]: field.value};
			this.setState({events: {...this.state.events, [eventType]: eventUpdate}, isValidAll: this.props.formMethods.isValidAll(this.props.fields)}, () => {
				if (this.props.formMethods.isValidAll(this.props.fields)) {
					this.setState({saving: true});
					this.data.events[eventType] = this.state.events[eventType];
					this.editor.saveEvent(eventType, this.state.events[eventType]).then(() => {
						this.setState({saving: false});
					});
				}
				if (['eventIcon', 'eventTitle', 'eventDesc', 'behaviour', ...actionTypes].includes(fieldName)) {
					const {fields} = this.props;

					if (!actionTypes.includes(fieldName)) {
						const options = [...fields.selectEvent.options];
						const matchValue = fields.selectEvent.matchingOption.value;
						const index = options.findIndex(option => option.value === matchValue);
						const event = this.state.events[matchValue];

						options[index] = {...options[index], ...{
							title: event.title || '-No title-',
							desc: event.desc || '',
							icon: event.icon,
							shape: event.behaviour === 'progress' ? 'rhombus' : 'circle',
						}};
						this.props.formMethods.updateOptions('selectEvent', options);
					}

					if (fieldName !== 'eventDesc') {
						// Trigger event icon/shape/name validation on multi-add fields
						this.props.formMethods.updateFields(
							actionTypes.reduce((obj, actionType) => {
								let values = [...fields[actionType].value];
								values.forEach((value, index) => {
									if (value.selectAction.value === 'createMessage' && (value.messageIconShape || {}).value === 'matchEvent') {
										value = {
											selectAction: value.selectAction,
											messageTitle: value.messageTitle,
											messageIconShape: value.messageIconShape,
											messageIcon: {
												value: fields.eventIcon.value,
												icon: fields.eventIcon.value,
												shape: fields.behaviour.value === 'progress' ? 'rhombus' : 'circle',
											},
											messageDesc: value.messageDesc,
											_index: value._index,
											_isValid: value._isValid,
										};
										values = [...values.slice(0, index), value, ...values.slice(index + 1)];
									}
								})
								return obj = {...obj, [actionType]: [...values]};
							}, {
								progressIncrease: [...fields.progressIncrease.value],
							})
						);
					}
				}
			});
		}
	}

	dataChange(newData, callback) {
		const isNewEvents = newData.events && this.data.events !== newData.events;
		const loadToState = () => {
			this.setState({...this.data, events: {...this.data.events, ...this.state.events}}, () => {
				this.loadInProgress = false;
				if (isNewEvents) {
					const selectOptions = Object.keys(this.state.events).map(eventType => {
						const event = this.state.events[eventType];

						return {
							valid: true,
							...(this.props.fields.selectEvent.options.find(option => option.value === eventType) || {}),
							value: eventType,
							title: event.title,
							desc: event.desc || '',
							icon: event.icon,
							shape: event.behaviour === 'progress' ? 'rhombus' : 'circle',
						};
					});
					this.props.formMethods.updateOptions('selectEvent', selectOptions, () => {
						this.loadCallbacks.forEach(fn => fn());
						this.loadCallbacks = [];
						if (!this.props.fields.selectEvent.value) {
							const eventTitle = (selectOptions.find(opt => opt.value === localStorage.currentEvent) || selectOptions[selectOptions.length -1]).title;
							this.props.formMethods.updateFields({selectEvent: eventTitle}, null, true);
						}
					});
				} else {
					this.loadCallbacks.forEach(fn => fn());
					this.loadCallbacks = [];
				}
			});
		};

		this.data = {...this.data, ...newData};
		this.props.fields.progressIncrease.config.data = this.data;
		actionFieldConfig.data = this.data;
		if (callback) {
			this.loadCallbacks.push(callback);
		}

		clearTimeout(this.loadTimer);
		this.loadTimer = setTimeout(loadToState, 100);
	}

	createNewEvent() {
		const baseEvent = this.state.events[(this.props.fields.selectEvent.matchingOption || {}).value] || defaultNewEvent;
		const newEventType = `eventType${this.data.newEventId}`;
		const newEvent = {...baseEvent, ...{
			title: `New event ${this.data.newEventId}`,
		}};
		localStorage.currentEvent = newEventType;
		this.props.formMethods.updateFields({selectEvent: ''}, () => {
			this.dataChange({events: {...this.data.events, [newEventType]: newEvent}}, () => {
				this.setState({saving: true});
				this.editor.saveEvent(newEventType, this.state.events[newEventType]).then(() => {
					this.setState({saving: false});
					this.data.newEventId++;
				});
			});
		});
	}

	toggleTooltip(type, isOpen) {
		this.setState({[`${type}Tooltip`]: isOpen});
	}

	validateFields(e) {
		const {selectEvent, ...otherFields} = this.props.fields;

		e.preventDefault();
		this.setState({saving: this.state.saving || false}, () => {
			this.props.formMethods.validateAll(otherFields);
		});
	}

	removeEvent() {
		const eventType = this.props.fields.selectEvent.matchingOption.value;

		this.setState({saving: true, isValidAll: true}, () => {
			this.editor.removeEvent(eventType).then(() => {
				this.props.formMethods.updateFields({selectEvent: ''}, () => {
					const {[eventType]: deleted, ...restOfEvents} = this.data.events;
					const {[eventType]: deleted2, ...restOfStateEvents} = this.state.events;

					this.setState({events: restOfStateEvents, saving: false}, () => {
						this.data.events = restOfEvents;
						this.dataChange({events: {...restOfEvents}});
					});
				});
			});
		});
	}

	render() {
		const {events, saving, isValidAll} = this.state;
		const {fields} = this.props;

		return (
			<Screen className="editor-screen">
				<form onSubmit={this.validateFields}>
					<input type="submit" className="access" tabindex="-1" />
					<div className="header">
						<div className="inner">
							<div className="row">
								<div className="col-30 col-l-20">
									<TitleMenu selected="events" />
								</div>
								<div className="col-70 col-l-50 event-select-col">
									{(saving !== undefined || !isValidAll) &&
										<Tooltip show={this.state.validateFieldsTooltip}
											toggleTooltip={isOpen => this.toggleTooltip('validateFields', isOpen)}>
											<button data-tooltip-trigger type="button" className="icon validate-fields" onClick={this.validateFields}>
												{!saving && isValidAll && <i className="done">done</i>}
												{!isValidAll && <i className="invalid">warning</i>}
												{saving && isValidAll && <i className="saving">sync</i>}
											</button>
											<p>
												{!isValidAll && 'Some fields are invalid. Changes cannot be saved.'}
												{saving && isValidAll && 'Saving.'}
												{saving === false && isValidAll && 'All changes saved.'}
											</p>
										</Tooltip>
									}
									<Field config={fields.selectEvent} />
									<Tooltip show={this.state.createNewEventTooltip}
										toggleTooltip={isOpen => this.toggleTooltip('createNewEvent', isOpen)}>
										<button data-tooltip-trigger
											disabled={!this.state.isValidAll}
											type="button" className="icon-raised primary add-event"
											onClick={this.createNewEvent}>
											<i>add</i>
										</button>
										<p>Create new event</p>
									</Tooltip>
								</div>
							</div>
						</div>
					</div>
					{fields.selectEvent.matchingOption &&
						<div className="form-content">
							<div className="inner">
								<div className="row">
									<div className="col-66 col-l-35 title-row">
										<Field config={fields.eventIcon} />
										<Field config={fields.eventTitle} />
									</div>
									<div className="col-33 col-l-35">
										<Field config={fields.behaviour} />
									</div>
								</div>
								<div className="row">
									<div className="col-50 col-l-35">
										<Field config={fields.eventDuration} />
									</div>
									<div className="col-50 col-l-35">
										<Field config={fields.eventDesc} />
									</div>
								</div>
								<div className="row">
									<div className="col-40 col-l-25">
										<Field config={fields.location} />
									</div>
									{fields.location.value !== 'any' &&
										<React.Fragment>
											<div className="col-20 col-l-15">
												<Field config={fields.posX} />
												<Field config={fields.offsetX} />
											</div>
											<div className="col-20 col-l-15">
												<Field config={fields.posY} />
												<Field config={fields.offsetY} />
											</div>
											<div className="col-20 col-l-15">
												<Field config={fields.range} />
											</div>
										</React.Fragment>
									}
								</div>
								<div className="row">
									<div className="col-50 col-l-25">
										<Field config={fields.energyCost} />
										<Field config={fields.progress} />
									</div>
									<div className="col-50 col-l-45">
										<Field config={fields.progressIncrease} />
									</div>
								</div>
								<div className="row">
									<div className="col-50 col-l-35">
										<Field config={fields.onStart} />
									</div>
									<div className="col-50 col-l-35">
										<Field config={fields.onEnd} />
									</div>
								</div>
								<div className="row">
									<div className="col-50 col-l-35">
										<Field config={fields.onSuccess} />
										<Field config={fields.onPop} />
									</div>
									<div className="col-50 col-l-35">
										<Field config={fields.onFail} />
										<Field config={fields.onNoPop} />
									</div>
								</div>
								<div className="row">
									<div className="col-50 col-l-35">
										<Field config={fields.onFullProgress} />
									</div>
									<div className="col-50 col-l-35">
									</div>
								</div>
								<div className="row">
									<div className="col-100 col-l-70">
										<div className="row-buttons">
											<button type="button" className="error" onClick={this.removeEvent}>Remove event</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					}
				</form>
			</Screen>
		);
	}
}

export default formWithValidation(EventEditorScreen, eventFields);
