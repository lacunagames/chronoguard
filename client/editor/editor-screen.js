
import './editor-screen.scss';

import React from 'react';

import Screen from '../components/screen';
import utils from 'utils';
import Editor from './editor';
import {formWithValidation, ErrorSummary, Field} from './form';
import Tooltip from '../components/tooltip';
import Modal from '../components/modal';

const fields = {
	selectEvent: {
		id: 'select-event',
		name: 'select-event',
		type: 'autocomplete',
		value: '',
		placeholder: 'Select event',
		options: [],
		rules: [],
		hideValidation: true,
	},
	eventIcon: {
		id: 'event-icon',
		type: 'hidden',
		value: '',
		rules: [],
		propOrig: 'icon',
	},
	eventTitle: {
		id: 'event-title',
		type: 'text',
		value: '',
		label: 'Event title',
		rules: [
			{type: 'required'},
			{type: 'minLength', minLength: 3},
			{type: 'unique', others: [], errorText: 'This value already exists, title has to be unique'},
		],
		propOrig: 'title',
	},
	eventDuration: {
		id: 'event-duration',
		type: 'text',
		value: '',
		label: 'Event duration',
		rules: [
			{type: 'required'},
			{type: 'range'},
		],
		propOrig: 'duration',
	},
	behaviour: {
		id: 'behaviour',
		type: 'toggle',
		label: 'Event behaviour',
		options: [
			{value: 'pop', title: 'Pop'},
			{value: 'chance', title: 'Chance'},
		],
		value: 'pop',
		rules: [],
		propOrig: 'behaviour',
	},
	energyCost: {
		id: 'energyCost',
		type: 'text',
		value: '',
		label: 'Energy cost',
		rules: [
			{type: 'positiveInteger'},
		],
		hidden: {field: 'behaviour', fieldValue: 'chance',},
		propOrig: 'energy',
	},
	eventDesc: {
		id: 'event-desc',
		type: 'textarea',
		value: '',
		label: 'Event description',
		rules: [
			{type: 'minLength', minLength: 3},
		],
		propOrig: 'desc',
	},
	chance: {
		id: 'chance',
		type: 'text',
		value: '',
		label: 'Starting chance (%)',
		rules: [
			{type: 'range'},
		],
		propOrig: 'chance',
		hidden: {field: 'behaviour', fieldValue: 'pop',},
	},
};

const defaultNewEvent = {
	icon: 'default',
	energy: 5,
	duration: 5,
	behaviour: 'pop',
};

class EditorScreen extends React.Component {

	constructor(props) {
		super(props);
		utils.bindThis(this, [
			'dataChange',
			'createNewEvent',
			'toggleTooltip',
			'toggleIconModal',
			'handleFieldChange',
			'validateFields',
		]);

		this.state = {
			currentTab: 'events',
			currentEvent: 'fire',
			changeIconTooltip: false,
			createNewEventTooltip: false,
			iconsModalOpen: false,
			iconsModalPos: undefined,
			events: {},
			icons: [],
			saving: undefined,
			isValidAll: true,
		};
		this.data = {};
		this.loadCallbacks = [];
		this.newEvents = {};
		this.editor = new Editor(this.dataChange);
		this.props.formMethods.onFieldChange(this.handleFieldChange);
		this.props.formMethods.onValidityChange(isValidAll => this.setState({isValidAll}));
	}

	componentWillUnmout() {
		clearTimeout(this.loadTimer);
	}

	handleFieldChange(fieldName, field) {
		if (!this.props.fields.selectEvent.matchingOption) {
			return;
		}
		const eventType = this.props.fields.selectEvent.matchingOption.value;
		const event = this.state.events[this.props.fields.selectEvent.matchingOption.value];

		if (fieldName === 'selectEvent') {
			this.props.formMethods.updateFields({
				eventTitle: event.title,
				eventDuration: event.duration,
				behaviour: event.behaviour,
				eventDesc: event.desc || '',
				eventIcon: event.icon,
				energyCost: event.energy || '',
				chance: event.chance || '',
			}, () => {
				const uniqueRule = this.props.fields.eventTitle.rules.find(rule => rule.type === 'unique');
				uniqueRule.others = Object.keys(this.state.events)
															.filter(name => name !== eventType && event.title.length >= 3)
															.map(name => this.state.events[name].title);
				this.setState({saving: undefined, isValidAll: this.props.formMethods.isValidAll(this.props.fields)}, () => {
					const {selectEvent, ...otherFields} = this.props.fields;
					this.props.formMethods.clearValidity(otherFields);
				});
			});
		} else if (event[field.propOrig] !== field.value) {
			const eventUpdate = {...event, [field.propOrig]: field.value};
			this.setState({events: {...this.state.events, [eventType]: eventUpdate}}, () => {
				if (this.props.formMethods.isValidAll(this.props.fields)) {
					this.setState({saving: true});
					this.editor.saveEvent(eventType, this.state.events[eventType]).then(() => {
						this.setState({saving: false});
					});
				}
				if (['eventIcon', 'eventTitle', 'eventDesc', 'behaviour'].includes(fieldName)) {
					const options = [...this.props.fields.selectEvent.options];
					const matchValue = this.props.fields.selectEvent.matchingOption.value;
					const index = options.findIndex(option => option.value === matchValue);
					const event = this.state.events[matchValue];

					options[index] = {...options[index], ...{
						title: event.title || '-No title-',
						desc: event.desc || '',
						icon: event.icon,
						iconStyle: event.behaviour === 'chance' ? 'rhombus' : 'circle',
					}};
					this.props.formMethods.updateOptions('selectEvent', options);
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
							value: eventType,
							title: event.title,
							desc: event.desc || '',
							icon: event.icon,
							iconStyle: event.behaviour === 'chance' ? 'rhombus' : 'circle',
						};
					});
					this.props.formMethods.updateOptions('selectEvent', selectOptions, () => {
						this.loadCallbacks.forEach(fn => fn());
						this.loadCallbacks = [];
					});
				} else {
					this.loadCallbacks.forEach(fn => fn());
					this.loadCallbacks = [];
				}
			});
		};

		this.data = {...this.data, ...newData};
		if (callback) {
			this.loadCallbacks.push(callback);
		}

		clearTimeout(this.loadTimer);
		this.loadTimer = setTimeout(loadToState, 100);
	}

	createNewEvent() {
		const baseEvent = this.state.events[(this.props.fields.selectEvent.matchingOption || {}).value] || defaultNewEvent;
		let i = 1;
		while (this.newEvents[`newEvent${i}`] || this.state.events[`newEvent${i}`]) {i++};

		this.newEvents[`newEvent${i}`] = {...baseEvent, ...{
			title: `New event ${i}`,
		}};
		this.dataChange({events: {...this.data.events, ...this.newEvents}}, () => {
			this.props.formMethods.updateFields({selectEvent: this.newEvents[`newEvent${i}`].title}, () => {
				this.props.formMethods.validateAll({selectEvent: this.props.fields.selectEvent});
			});
		});
	}

	toggleTooltip(type, isOpen) {
		this.setState({[`${type}Tooltip`]: isOpen});
	}

	toggleIconModal() {
		this.setState({
			iconsModalOpen: !this.state.iconsModalOpen,
			iconsModalPos: this.refs.iconsModalButton.getBoundingClientRect(),
		});
	}

	iconSelect(iconName) {
		this.props.formMethods.updateFields({eventIcon: iconName}, null, true);
	}

	validateFields() {
		const {selectEvent, ...otherFields} = this.props.fields;
		this.props.formMethods.validateAll(otherFields);
	}

	render() {
		const {events, icons, saving, isValidAll} = this.state;
		const {fields} = this.props;

		return (
			<Screen className="editor-screen">
				<form>
					<div className="header">
						<div className="row">
							<div className="col-30 col-l-20">
								<h3>Event editor</h3>
							</div>
							<div className="col-70 col-l-50 event-select-col">
								{(saving !== undefined || !isValidAll) &&
									<Tooltip show={this.state.validateFieldsTooltip}
										toggleTooltip={isOpen => this.toggleTooltip('validateFields', isOpen)}>
										<button data-tooltip-trigger type="button" className="icon validate-fields" onClick={this.validateFields}>
											{!saving && isValidAll && <i className="success">done</i>}
											{!isValidAll && <i className="error">feedback</i>}
											{saving && isValidAll && <i>sms</i>}
										</button>
										<p>{isValidAll ? 'All fields are valid' : 'Validate fields'}</p>
									</Tooltip>
								}
								<Field config={fields.selectEvent} />
								<Tooltip show={this.state.createNewEventTooltip}
									toggleTooltip={isOpen => this.toggleTooltip('createNewEvent', isOpen)}>
									<button data-tooltip-trigger type="button" className="primary icon add-event" onClick={this.createNewEvent}>
										<i>add</i>
									</button>
									<p>Create new event</p>
								</Tooltip>
							</div>
						</div>
					</div>
					{fields.selectEvent.matchingOption &&
						<div className="form-content">
							<div className="row">
								<div className="col-66 col-l-35 title-col">
									<Field config={fields.eventIcon} />
									<Tooltip show={this.state.changeIconTooltip} toggleTooltip={isOpen => this.toggleTooltip('changeIcon', isOpen)}>
										<button data-tooltip-trigger
											type="button"
											className={utils.getClassName({'primary icon select-icon': true, rhombus: fields.behaviour.value === 'chance'})}
											ref="iconsModalButton"
											onClick={this.toggleIconModal}>
											<span style={utils.getIconStyle(fields.eventIcon.value)} />
										</button>
										<p>Change event icon</p>
									</Tooltip>
									<Field config={fields.eventTitle} />
								</div>
								<div className="col-33 col-l-25">
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
								<div className="col-50 col-l-35">
									{fields.behaviour.value === 'pop' &&
										<Field config={fields.energyCost} />
									}
									{fields.behaviour.value === 'chance' &&
										<Field config={fields.chance} />
									}
								</div>
							</div>
						</div>
					}
				</form>
				<Modal show={this.state.iconsModalOpen} pos={this.state.iconsModalPos} locked={false} onClose={this.toggleIconModal}>
					<h3 data-modal-head>Change event icon</h3>
					<fieldset className="icon-radios">
						{icons && icons.map(iconName => (
							<Tooltip show={this.state[`${iconName}IconTooltip`]}
								toggleTooltip={isOpen => this.toggleTooltip(`${iconName}Icon`, isOpen)}>
								<div key={iconName} data-tooltip-trigger>
									<input type="radio"
										value={iconName}
										name="icon-radios"
										id={iconName}
										checked={fields.eventIcon.value === iconName}
										onChange={() => this.iconSelect(iconName)} />
									<label htmlFor={iconName} className={fields.behaviour.value === 'chance' ? 'rhombus' : ''}>
										<span style={utils.getIconStyle(iconName)}>{iconName}</span>
									</label>
								</div>
								<p>{iconName}</p>
							</Tooltip>
						))}
					</fieldset>
				</Modal>
			</Screen>
		);
	}
}

export default formWithValidation(EditorScreen, fields);
