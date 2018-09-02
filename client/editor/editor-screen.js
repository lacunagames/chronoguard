
import './editor-screen.scss';

import React from 'react';

import Screen from '../components/screen';
import utils from 'utils';
import Editor from './editor';
import {formWithValidation, Field} from './form';
import Tooltip from '../components/tooltip';
import Modal from '../components/modal';
import config from '../config';
import allAssets from '../game/data/assets';

const actionFieldConfig = {
	fields: {
		selectAction: {
			id: 'select-action',
			type: 'select',
			value: '',
			label: 'Select action',
			options: [
				{value: '', title: 'Select action', icon: 'default', disabled: true},
				{value: 'queueEvent', title: 'Queue event', icon: 'queue'},
				{value: 'removeEvents', title: 'Remove events', icon: 'remove'},
				{value: 'createMapObj', title: 'Create map item', icon: 'map'},
				{value: 'createMessage', title: 'Create message', icon: 'message'},
				{value: 'playerAttrs', title: 'Player attributes', icon: 'player'},
				{value: 'boxAttrs', title: 'Custom values', icon: 'box'},
			],
			rules: [
				{type: 'required'},
			],
		},
		queueEvent: {
			id: 'queue-event',
			type: 'autocomplete',
			value: '',
			label: 'Select event',
			options: [],
			hidden: {field: 'selectAction', fieldValueNot: 'queueEvent'},
			rules: [
				{type: 'required'},
				{type: 'matchOption'},
			],
		},
		removeEvents: {
			id: 'remove-events',
			type: 'multicomplete',
			value: [],
			label: 'Select events',
			options: [],
			hidden: {field: 'selectAction', fieldValueNot: 'removeEvents'},
			rules: [
				{type: 'required'},
			],
		},
		delayEvent: {
			id: 'delayEvent',
			type: 'text',
			value: '',
			label: 'Delay',
			hidden: {field: 'selectAction', fieldValueNot: 'queueEvent'},
			rules: [
				{type: 'required'},
				{type: 'range'},
				{type: 'rangeMin', value: 1},
			],
		},
		selectMapObj: {
			id: 'select-mapobj',
			type: 'select',
			value: '',
			label: 'Map item',
			hidden: {field: 'selectAction', fieldValueNot: 'createMapObj'},
			options: ['', ...Object.keys(allAssets.images), ...Object.keys(allAssets.videos)].map((name, index) => {
				const isVideo = index > Object.keys(allAssets.images).length;

				return {
					value: name,
					title: name ? name[0].toUpperCase() + name.slice(1) : 'Select map item',
					icon: isVideo ? 'video' : 'painting',
					disabled: !name,
				};
			}),
			rules: [
				{type: 'required'},
			],
		},
		mapObjLocation: {
			id: 'location-mapobj',
			type: 'select',
			label: 'Location',
			hidden: {field: 'selectAction', fieldValueNot: 'createMapObj'},
			options: [
				{value: 'event', title: 'This event'},
				{value: 'village', title: 'Village'},
			],
			value: 'event',
			rules: [{type: 'required'}],
		},
		delayMapObj: {
			id: 'delayMapObj',
			type: 'text',
			value: '',
			label: 'Delay',
			hidden: {field: 'selectAction', fieldValueNot: 'createMapObj'},
			rules: [
				{type: 'range'},
			],
		},
		messageTitle: {
			id: 'message-title',
			type: 'text',
			value: '',
			label: 'Title',
			hidden: {field: 'selectAction', fieldValueNot: 'createMessage'},
			rules: [
				{type: 'required'},
				{type: 'minLength', value: 3},
			],
		},
		messageDescription: {
			id: 'message-desc',
			type: 'textarea',
			value: '',
			label: 'Description',
			hidden: {field: 'selectAction', fieldValueNot: 'createMessage'},
			rules: [
				{type: 'minLength', value: 3},
			],
		},
		playerAttrs: {
			id: 'player-attrs',
			type: 'select',
			value: '',
			label: 'Player attributes',
			hidden: {field: 'selectAction', fieldValueNot: 'playerAttrs'},
			options: [
				{value: '', title: 'Select attribute action', disabled: true},
				{value: 'gainSkillPoints', title: 'Gain skill points'},
				{value: 'changeEnergy', title: 'Change energy by'},
				{value: 'changeMaxEnergy', title: 'Change maximum energy by'},
				{value: 'changeEnergyGainRate', title: 'Change energy gain rate by'},
			],
			rules: [
				{type: 'required'},
			],
		},
		playerAttrValue: {
			id: 'player-attr-val',
			type: 'text',
			value: '',
			label: 'Value',
			hidden: [
				{field: 'selectAction', fieldValueNot: 'playerAttrs'},
				{field: 'playerAttrs', fieldValue: 'gainSkillPoints'},
			],
			rules: [
				{type: 'required'},
				{type: 'number'},
			],
		},
		playerAttrWhole: {
			id: 'player-attr-whole',
			type: 'text',
			value: '',
			label: 'Value',
			hidden: [
				{field: 'selectAction', fieldValueNot: 'playerAttrs'},
				{field: 'playerAttrs', fieldValueNot: 'gainSkillPoints'},
			],
			rules: [
				{type: 'required'},
				{type: 'wholeNumber'},
				{type: 'min', value: 1},
			],
		},
		boxName: {
			id: 'box-name',
			type: 'autocomplete',
			value: '',
			label: 'Name',
			hidden: {field: 'selectAction', fieldValueNot: 'boxAttrs'},
			options: [
				{value: 'fireNode', title: 'fireNode'},
				{value: 'waterNode', title: 'waterNode'},
			],
			rules: [
				{type: 'required'},
			],
		},
		boxActionType: {
			id: 'box-action-type',
			type: 'toggle',
			label: 'Type',
			hidden: {field: 'selectAction', fieldValueNot: 'boxAttrs'},
			options: [
				{value: 'change', title: 'Change by'},
				{value: 'set', title: 'Set to'},
			],
			value: 'change',
			rules: [],
		},
		boxValue: {
			id: 'box-value',
			type: 'text',
			value: '',
			label: 'Value',
			hidden: {field: 'selectAction', fieldValueNot: 'boxAttrs'},
			rules: [
				{type: 'required'},
				{type: 'number'},
			],
		},
	},
	data: {},
	getOptionsData: {
		queueEvent: data => Object.keys(data.events || {})
														.map(eventName => ({
															value: eventName,
															title: data.events[eventName].title,
															icon: data.events[eventName].icon,
															iconStyle: data.events[eventName].behaviour === 'chance' ? 'rhombus' : 'circle',
														})),
		removeEvents: data => Object.keys(data.events || {})
														.map(eventName => ({
															value: eventName,
															title: data.events[eventName].title,
															icon: data.events[eventName].icon,
															iconStyle: data.events[eventName].behaviour === 'chance' ? 'rhombus' : 'circle',
														}))
	},
	display: {
		selectAction: {type: 'icon'},
		delayEvent: {pre: 'Delay: '},
		delayMapObj: {pre: 'Delay: '},
		mapObjLocation: {pre: 'Location: '},
	},
	renderForm: fields => (
		<React.Fragment>
			<div className="row">
				<div className="col-100">
					<Field config={fields.selectAction} />
				</div>
				<div className="col-100">
					<Field config={fields.queueEvent} />
					<Field config={fields.removeEvents} />
					<Field config={fields.selectMapObj} />
					<Field config={fields.messageTitle} />
					<Field config={fields.playerAttrs} />
					<Field config={fields.boxName} />
				</div>
				<div className="col-100">
					<Field config={fields.delayEvent} />
					<Field config={fields.mapObjLocation} />
					<Field config={fields.messageDescription} />
					<Field config={fields.playerAttrValue} />
					<Field config={fields.playerAttrWhole} />
					<Field config={fields.boxActionType} />
				</div>
				<div className="col-100">
					<Field config={fields.delayMapObj} />
					<Field config={fields.boxValue} />
				</div>
			</div>
		</React.Fragment>
	),
};

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
			{type: 'minLength', value: 3},
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
	},
	location: {
		id: 'location',
		type: 'select',
		label: 'Location',
		options: [
			{value: 'any', title: '- Anywhere'},
			{value: 'fixed', title: '- Fixed location'},
			{value: 'village', title: 'Village'},
		],
		value: 'any',
		rules: [],
	},
	posX: {
		id: 'posx',
		type: 'text',
		value: '100',
		label: 'X position',
		rules: [
			{type: 'required'},
			{type: 'wholeNumber'},
			{type: 'min', value: 100},
			{type: 'max', value: config.mapWidth - 100},
		],
		hidden: {field: 'location', fieldValueNot: 'fixed',},
		propOrig: 'fixedPosX',
	},
	posY: {
		id: 'posy',
		type: 'text',
		value: '100',
		label: 'Y position',
		rules: [
			{type: 'required'},
			{type: 'wholeNumber'},
			{type: 'min', value: 100},
			{type: 'max', value: config.mapHeight - 100},
		],
		hidden: {field: 'location', fieldValueNot: 'fixed',},
		propOrig: 'fixedPosY',
	},
	offsetX: {
		id: 'offsetx',
		type: 'text',
		value: '',
		label: 'X offset',
		rules: [
			{type: 'wholeNumber'},
		],
		hidden: {field: 'location', fieldValue: ['fixed', 'any']},
	},
	offsetY: {
		id: 'offsety',
		type: 'text',
		value: '',
		label: 'Y offset',
		rules: [
			{type: 'wholeNumber'},
		],
		hidden: {field: 'location', fieldValue: ['fixed', 'any']},
	},
	range: {
		id: 'range',
		type: 'text',
		value: '',
		label: 'Range',
		rules: [
			{type: 'wholeNumber'},
			{type: 'min', value: 20},
		],
		hidden: {field: 'location', fieldValue: 'any',},
	},
	energyCost: {
		id: 'energy-cost',
		type: 'text',
		value: '',
		label: 'Energy cost',
		rules: [
			{type: 'wholeNumber'},
			{type: 'min', value: 0},
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
			{type: 'minLength', value: 3},
		],
		propOrig: 'desc',
	},
	chance: {
		id: 'chance',
		type: 'text',
		value: '',
		label: 'Base chance (%)',
		rules: [
			{type: 'range'},
		],
		hidden: {field: 'behaviour', fieldValue: 'pop',},
	},
	chanceIncrease: {
		id: 'chance-increase',
		type: 'multiAdd',
		value: [],
		label: 'Chance increase',
		rules: [{type: 'allValidValues'}],
		hidden: {field: 'behaviour', fieldValue: 'pop',},
		propOrig: 'chanceIncreaseEdit',
		config: {
			fields: {
				chanceEvent: {
					id: 'chance-event',
					type: 'autocomplete',
					value: '',
					label: 'Select pop event',
					options: [],
					rules: [
						{type: 'required'},
						{type: 'matchOption'},
					],
				},
				increase: {
					id: 'increase',
					type: 'text',
					value: '',
					label: 'Chance increase (%)',
					rules: [
						{type: 'required'},
						{type: 'range'},
					],
				},
			},
			display: {increase: {post: '%'}},
			uniqueOptionField: 'chanceEvent',
			getOptionsData: {
				chanceEvent: (data, values) => Object.keys(data.events || {})
																				.filter(name => data.events[name].behaviour === 'pop' && !values.includes(name))
																				.map(eventName => ({
																					value: eventName,
																					title: data.events[eventName].title,
																					icon: data.events[eventName].icon,
																					iconStyle: 'circle',
																				}))},
			data: {},
			renderForm: fields => (
				<React.Fragment>
					<div className="row">
						<div className="col-100">
							<Field config={fields.chanceEvent} />
						</div>
					</div>
					<div className="row">
						<div className="col-100">
							<Field config={fields.increase} />
						</div>
					</div>
				</React.Fragment>
			),
		},
	},
	onStart: {
		id: 'on-start',
		type: 'multiAdd',
		value: [],
		label: 'onStart',
		rules: [{type: 'allValidValues'}],
		propOrig: 'onStartEdit',
		config: actionFieldConfig,
	},
	onEnd: {
		id: 'on-end',
		type: 'multiAdd',
		value: [],
		label: 'onEnd',
		rules: [{type: 'allValidValues'}],
		propOrig: 'onEndEdit',
		config: actionFieldConfig,
	},
	onAction: {
		id: 'on-action',
		type: 'multiAdd',
		value: [],
		label: 'onAction',
		rules: [{type: 'allValidValues'}],
		propOrig: 'onActionEdit',
		config: actionFieldConfig,
		hidden: {field: 'behaviour', fieldValue: 'chance',},
	},
	onNoAction: {
		id: 'on-no-action',
		type: 'multiAdd',
		value: [],
		label: 'onNoAction',
		rules: [{type: 'allValidValues'}],
		propOrig: 'onNoActionEdit',
		config: actionFieldConfig,
		hidden: {field: 'behaviour', fieldValue: 'chance',},
	},
	onSuccess: {
		id: 'on-success',
		type: 'multiAdd',
		value: [],
		label: 'onSuccess',
		rules: [{type: 'allValidValues'}],
		propOrig: 'onSuccessEdit',
		config: actionFieldConfig,
		hidden: {field: 'behaviour', fieldValue: 'pop',},
	},
	onFail: {
		id: 'on-fail',
		type: 'multiAdd',
		value: [],
		label: 'onFail',
		rules: [{type: 'allValidValues'}],
		propOrig: 'onFailEdit',
		config: actionFieldConfig,
		hidden: {field: 'behaviour', fieldValue: 'pop',},
	},
	onFullChance: {
		id: 'on-full-chance',
		type: 'multiAdd',
		value: [],
		label: 'onFullChance',
		rules: [{type: 'allValidValues'}],
		propOrig: 'onFullChanceEdit',
		config: actionFieldConfig,
		hidden: {field: 'behaviour', fieldValue: 'pop',},
	}
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
			'removeEvent',
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
		this.props.chanceIncrease
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
			this.props.formMethods.updateFields({
				eventTitle: event.title,
				eventDuration: event.duration,
				behaviour: event.behaviour,
				eventDesc: event.desc || '',
				eventIcon: event.icon,
				energyCost: event.energy || '',
				chance: event.chance || '',
				location: event.location || 'any',
				posX: event.fixedPosX || '100',
				posY: event.fixedPosY || '100',
				offsetX: event.offsetX || '',
				offsetY: event.offsetY || '',
				range: event.range || '',
				chanceIncrease: event.chanceIncreaseEdit,
			}, () => {
				const uniqueRule = this.props.fields.eventTitle.rules.find(rule => rule.type === 'unique');
				uniqueRule.others = Object.keys(this.state.events)
															.filter(name => name !== eventType && event.title.length >= 3)
															.map(name => this.state.events[name].title);
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
					this.editor.saveEvent(eventType, this.state.events[eventType]).then(() => {
						this.setState({saving: false});
						this.data.events[eventType] = this.state.events[eventType];
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
							valid: true,
							...(this.props.fields.selectEvent.options.find(option => option.value === eventType) || {}),
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
						if (!this.props.fields.selectEvent.value) {
							this.props.formMethods.updateFields({selectEvent: selectOptions[selectOptions.length -1].title}, null, true);
						}
					});
				} else {
					this.loadCallbacks.forEach(fn => fn());
					this.loadCallbacks = [];
				}
			});
		};

		this.data = {...this.data, ...newData};
		this.props.fields.chanceIncrease.config.data = this.data;
		actionFieldConfig.data = this.data;
		if (callback) {
			this.loadCallbacks.push(callback);
		}

		clearTimeout(this.loadTimer);
		this.loadTimer = setTimeout(loadToState, 100);
	}

	createNewEvent() {
		const baseEvent = this.state.events[(this.props.fields.selectEvent.matchingOption || {}).value] || defaultNewEvent;
		let i = 1;
		while (this.state.events[`eventType${i}`]) {i++};

		const newEventType = `eventType${i}`;
		const newEvent = {...baseEvent, ...{
			title: `New event ${i}`,
		}};
		this.dataChange({events: {...this.data.events, [newEventType]: newEvent}}, () => {
			this.setState({saving: true});
			this.props.formMethods.updateFields({selectEvent: newEvent.title}, null, true);
			this.editor.saveEvent(newEventType, this.state.events[newEventType]).then(() => {
				this.setState({saving: false});
			});
		});
	}

	toggleTooltip(type, isOpen) {
		this.setState({[`${type}Tooltip`]: isOpen});
	}

	toggleIconModal(e) {
		e.preventDefault();
		this.setState({
			iconsModalOpen: !this.state.iconsModalOpen,
			iconsModalPos: this.refs.iconsModalButton.getBoundingClientRect(),
		});
	}

	iconSelect(iconName) {
		this.props.formMethods.updateFields({eventIcon: iconName}, null, true);
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
		const {events, icons, saving, isValidAll} = this.state;
		const {fields} = this.props;

		return (
			<Screen className="editor-screen">
				<form onSubmit={this.validateFields}>
					<input type="submit" className="access" tabindex="-1" />
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
											{!saving && isValidAll && <i className="done">done</i>}
											{!isValidAll && <i className="invalid">warning</i>}
											{saving && isValidAll && <i className="saving">sync</i>}
										</button>
										<p>
											{!isValidAll && 'Some fields are invalid. Changes cannot be saved.'}
											{saving === false && isValidAll && ' All changes saved.'}
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
					{fields.selectEvent.matchingOption &&
						<div className="form-content">
							<div className="row">
								<div className="col-66 col-l-35 title-col">
									<Field config={fields.eventIcon} />
									<Tooltip show={this.state.changeIconTooltip} toggleTooltip={isOpen => this.toggleTooltip('changeIcon', isOpen)}>
										<button data-tooltip-trigger
											type="button"
											className={utils.getClassName({'primary icon-raised select-icon': true, rhombus: fields.behaviour.value === 'chance'})}
											ref="iconsModalButton"
											onClick={this.toggleIconModal}>
											<span style={utils.getIconStyle(fields.eventIcon.value)} />
										</button>
										<p>Change event icon</p>
									</Tooltip>
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
									<Field config={fields.chance} />
								</div>
								<div className="col-50 col-l-45">
									<Field config={fields.chanceIncrease} />
								</div>
							</div>
							<div className="row">
								<div className="col-50 col-l-25">
									<Field config={fields.onStart} />
								</div>
								<div className="col-50 col-l-45">
									<Field config={fields.onEnd} />
								</div>
							</div>
							<div className="row">
								<div className="col-50 col-l-25">
									<Field config={fields.onSuccess} />
									<Field config={fields.onAction} />
								</div>
								<div className="col-50 col-l-45">
									<Field config={fields.onFail} />
									<Field config={fields.onNoAction} />
								</div>
							</div>
							<div className="row">
								<div className="col-50 col-l-25">
									<Field config={fields.onFullChance} />
								</div>
								<div className="col-50 col-l-45">
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
					}
				</form>
				<Modal show={this.state.iconsModalOpen} pos={this.state.iconsModalPos} locked={false} onClose={this.toggleIconModal}>
					<h3 data-modal-head>Change event icon</h3>
					<form onSubmit={this.toggleIconModal}>
						<input type="submit" className="access" tabindex="-1" />
						<fieldset className="icon-radios">
							{icons && icons.map(iconName => (
								<Tooltip show={this.state[`${iconName}IconTooltip`]}
									toggleTooltip={isOpen => this.toggleTooltip(`${iconName}Icon`, isOpen)}>
									<div key={iconName} data-tooltip-trigger>
										<input type="radio"
											value={iconName}
											name="icon-radios"
											id={`icon-input-${iconName}`}
											checked={fields.eventIcon.value === iconName}
											onChange={() => this.iconSelect(iconName)} />
										<label htmlFor={`icon-input-${iconName}`} className={fields.behaviour.value === 'chance' ? 'rhombus' : ''}>
											<span style={utils.getIconStyle(iconName)}>{iconName}</span>
										</label>
									</div>
									<p>{iconName}</p>
								</Tooltip>
							))}
						</fieldset>
					</form>
				</Modal>
			</Screen>
		);
	}
}

export default formWithValidation(EditorScreen, fields);
