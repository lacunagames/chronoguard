
import React from 'react';

import {Field} from './form';
import config from '../config';
import {mapImages as allImages, mapVideos as allVideos, positions as allPositions, icons as allIcons} from '../game/data/data.json';
import {actionTypes} from '../game/world';

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
				{value: 'destroyMapObj', title: 'Destroy map item', icon: 'map-remove'},
				{value: 'createMessage', title: 'Create message', icon: 'message'},
				{value: 'playerAttrs', title: 'Player attributes', icon: 'player'},
				{value: 'boxAttrs', title: 'Box values', icon: 'box'},
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
				{type: 'matchOption'},
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
			hidden: {field: 'selectAction', fieldValueNot: ['createMapObj', 'destroyMapObj']},
			options: ['', ...allImages, ...allVideos].map((name, index) => {
				const isVideo = index > allImages.length;

				return {
					value: name,
					title: name ? name[0].toUpperCase() + name.slice(1) : 'Select map item',
					icon: isVideo ? 'video'
												: name ? 'painting' : 'default',
					disabled: !name,
				};
			}),
			rules: [
				{type: 'required'},
			],
		},
		createMapObjLocation: {
			id: 'location-mapobj-create',
			type: 'select',
			label: 'Location',
			hidden: {field: 'selectAction', fieldValueNot: 'createMapObj'},
			options: [],
			value: 'event',
			rules: [{type: 'required'}],
		},
		destroyMapObjLocation: {
			id: 'location-mapobj-remove',
			type: 'select',
			label: 'Location',
			hidden: {field: 'selectAction', fieldValueNot: 'destroyMapObj'},
			options: [],
			value: 'any',
			rules: [],
		},
		delayMapObj: {
			id: 'delayMapObj',
			type: 'text',
			value: '',
			label: 'Delay',
			hidden: {field: 'selectAction', fieldValueNot: ['createMapObj', 'destroyMapObj']},
			rules: [
				{type: 'range'},
			],
		},
		noDestroyMapObjAnimation: {
			id: 'no-destroy-mapobj-animation',
			type: 'checkbox',
			value: '',
			label: 'Skip fade out animation',
			checkedValue: 'No animation',
			hidden: {field: 'selectAction', fieldValueNot: 'destroyMapObj'},
			rules: [],
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
		messageIconShape: {
			id: 'message-shape',
			type: 'select',
			label: 'Message icon',
			hidden: {field: 'selectAction', fieldValueNot: 'createMessage'},
			options: [
				{value: 'noIcon', title: '- No icon'},
				{value: 'matchEvent', title: '- Match event'},
				{value: 'rhombus', title: 'Rhombus shape'},
				{value: 'circle', title: 'Circle shape'},
				{value: 'square', title: 'Square shape'},
			],
			value: 'noIcon',
			rules: [],
		},
		messageIcon: {
			id: 'message-icon',
			type: 'iconSelect',
			value: 'default',
			placeholder: 'Select message icon',
			options: allIcons.map(name => ({value: name, title: name, icon: name})),
			hidden: [
				{field: 'selectAction', fieldValueNot: 'createMessage'},
				{field: 'messageIconShape', fieldValue: ['noIcon', 'matchEvent']},
			],
			rules: [],
			shape: {
				valueOf: 'messageIconShape',
				valueFn: value => ['circle', 'rhombus', 'square'].includes(value) ? value : 'circle',
			},
			propOrig: 'icon',
			hideValidation: true,
			updateWhenChanged: 'messageIconShape',
		},
		messageDesc: {
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
			options: [],
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
															shape: data.events[eventName].behaviour === 'progress' ? 'rhombus' : 'circle',
														})),
		removeEvents: data => Object.keys(data.events || {})
														.map(eventName => ({
															value: eventName,
															title: data.events[eventName].title,
															icon: data.events[eventName].icon,
															shape: data.events[eventName].behaviour === 'progress' ? 'rhombus' : 'circle',
														})),
		createMapObjLocation: data => {
			const fixedPositions = data.positions.map(posObj => ({value: posObj.id,	title: posObj.name}));

			return [{value: 'event', title: 'This event'}, ...fixedPositions];
		},
		destroyMapObjLocation: data => {
			const fixedPositions = data.positions.map(posObj => ({value: posObj.id,	title: posObj.name}));

			return [{value: 'any', title: 'Anywhere'}, {value: 'event', title: 'This event'}, ...fixedPositions];
		},
		boxName: data => {
			const uniqueNames = [];

			for (let eventName in data.events) {
				actionTypes.forEach(actionType => {
					data.events[eventName][actionType] && data.events[eventName][actionType].forEach(action => {
						const actionName = Object.keys(action)[0];

						if (['changeBoxAttr', 'setBoxAttr'].includes(actionName) && uniqueNames.indexOf(action[actionName][0]) === -1) {
							uniqueNames.push(action[actionName][0]);
						}
					});

					data.events[eventName][`${actionType}Editor`] && data.events[eventName][`${actionType}Editor`].forEach(action => {
						if (action.boxName && uniqueNames.indexOf(action.boxName) === -1) {
							uniqueNames.push(action.boxName);
						}
					});
				});
			}
			return uniqueNames.map(name => ({value: name, title: name}));
		}
	},
	display: {
		selectAction: {type: 'icon'},
		delayEvent: {pre: 'Delay: '},
		messageIconShape: {type: 'hidden'},
		messageIcon: {type: 'iconText'},
		delayMapObj: {pre: 'Delay: '},
		createMapObjLocation: {pre: 'Location: '},
		destroyMapObjLocation: {pre: 'Location: '},
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
					<Field config={fields.createMapObjLocation} />
					<Field config={fields.destroyMapObjLocation} />
					<div className="icon-select-row">
						<Field config={fields.messageIconShape} />
						<Field config={fields.messageIcon} />
					</div>
					<Field config={fields.playerAttrValue} />
					<Field config={fields.playerAttrWhole} />
					<Field config={fields.boxActionType} />
				</div>
				<div className="col-100">
					<Field config={fields.messageDesc} />
					<Field config={fields.delayMapObj} />
					<Field config={fields.boxValue} />
				</div>
				<div className="col-100">
					<Field config={fields.noDestroyMapObjAnimation} />
				</div>
			</div>
		</React.Fragment>
	),
};

const actionFieldConfigCondition = {
	...actionFieldConfig,
	fields: {
		...actionFieldConfig.fields,
		messageIconShape: {
			...actionFieldConfig.fields.messageIconShape,
			options: actionFieldConfig.fields.messageIconShape.options.filter(opt => opt.value !== 'matchEvent'),
		},
		createMapObjLocation: {
			...actionFieldConfig.fields.createMapObjLocation,
			value: '',
		}
	},
	getOptionsData: {
		...actionFieldConfig.getOptionsData,
		createMapObjLocation: data => {
			const fixedPositions = data.positions.map(posObj => ({value: posObj.id,	title: posObj.name}));

			return [{value: '', title: 'Select location', disabled: true}, ...fixedPositions];
		},
		destroyMapObjLocation: data => {
			const fixedPositions  = data.positions.map(posObj => ({value: posObj.id,	title: posObj.name}));

			return [{value: 'any', title: 'Anywhere'}, ...fixedPositions];
		},
	},
};

const eventFields = {
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
		type: 'iconSelect',
		value: 'default',
		placeholder: 'Change event icon',
		options: allIcons.map(name => ({value: name, title: name})),
		rules: [],
		shape: {
			valueOf: 'behaviour',
			valueFn: value => value === 'progress' ? 'rhombus' : 'circle',
		},
		propOrig: 'icon',
		hideValidation: true,
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
			{value: 'progress', title: 'Progress'},
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
			{value: 'fixed', title: '- Fixed'},
			...allPositions.map(posObj => ({value: posObj.id, title: posObj.name})),
		],
		value: 'any',
		rules: [{type: 'matchOption'}],
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
		hidden: {field: 'behaviour', fieldValue: 'progress',},
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
	progress: {
		id: 'progress',
		type: 'text',
		value: '',
		label: 'Base progress (%)',
		rules: [
			{type: 'range'},
		],
		hidden: {field: 'behaviour', fieldValue: 'pop',},
	},
	progressIncrease: {
		id: 'progress-increase',
		type: 'multiAdd',
		value: [],
		label: 'Progress increase',
		rules: [{type: 'allValidValues'}],
		hidden: {field: 'behaviour', fieldValue: 'pop',},
		propOrig: 'progressIncreaseEditor',
		config: {
			fields: {
				progressEvent: {
					id: 'progress-event',
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
					label: 'Progress increase (%)',
					rules: [
						{type: 'required'},
						{type: 'range'},
					],
				},
			},
			display: {increase: {post: '%'}},
			uniqueOptionField: 'progressEvent',
			getOptionsData: {
				progressEvent: (data, values) => Object.keys(data.events || {})
																				.filter(name => data.events[name].behaviour === 'pop' && !values.includes(name))
																				.map(eventName => ({
																					value: eventName,
																					title: data.events[eventName].title,
																					icon: data.events[eventName].icon,
																					shape: 'circle',
																				}))},
			data: {},
			renderForm: fields => (
				<React.Fragment>
					<div className="row">
						<div className="col-100">
							<Field config={fields.progressEvent} />
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
		propOrig: 'onStartEditor',
		config: actionFieldConfig,
	},
	onEnd: {
		id: 'on-end',
		type: 'multiAdd',
		value: [],
		label: 'onEnd',
		rules: [{type: 'allValidValues'}],
		propOrig: 'onEndEditor',
		config: actionFieldConfig,
	},
	onPop: {
		id: 'on-action',
		type: 'multiAdd',
		value: [],
		label: 'onPop',
		rules: [{type: 'allValidValues'}],
		propOrig: 'onPopEditor',
		config: actionFieldConfig,
		hidden: {field: 'behaviour', fieldValue: 'progress',},
	},
	onNoPop: {
		id: 'on-no-action',
		type: 'multiAdd',
		value: [],
		label: 'onNoPop',
		rules: [{type: 'allValidValues'}],
		propOrig: 'onNoPopEditor',
		config: actionFieldConfig,
		hidden: {field: 'behaviour', fieldValue: 'progress',},
	},
	onSuccess: {
		id: 'on-success',
		type: 'multiAdd',
		value: [],
		label: 'onSuccess',
		rules: [{type: 'allValidValues'}],
		propOrig: 'onSuccessEditor',
		config: actionFieldConfig,
		hidden: {field: 'behaviour', fieldValue: 'pop',},
	},
	onFail: {
		id: 'on-fail',
		type: 'multiAdd',
		value: [],
		label: 'onFail',
		rules: [{type: 'allValidValues'}],
		propOrig: 'onFailEditor',
		config: actionFieldConfig,
		hidden: {field: 'behaviour', fieldValue: 'pop',},
	},
	onFullProgress: {
		id: 'on-full-progress',
		type: 'multiAdd',
		value: [],
		label: 'onFullProgress',
		rules: [{type: 'allValidValues'}],
		propOrig: 'onFullProgressEditor',
		config: actionFieldConfig,
		hidden: {field: 'behaviour', fieldValue: 'pop',},
	}
};

const stateFields = {
	positions: {
		id: 'positions',
		type: 'multiAdd',
		value: [],
		label: 'Locations',
		rules: [{type: 'allValidValues'}],
		propOrig: 'positionsEditor',
		config: {
			fields: {
				id: {
					type: 'hidden',
					rules: [],
					value: '',
					generateValue: config => {
						const val = `pos${config.newId}`;
						config.newId++;
						return val;
					},
				},
				positionName: {
					id: 'position-name',
					type: 'text',
					value: '',
					label: 'Name',
					rules: [
						{type: 'required'},
						{type: 'minLength', value: 3},
						{type: 'unique', others: [], errorText: 'Title has to be unique'},
					],
				},
				posX: {
					id: 'posx',
					type: 'text',
					value: '',
					label: 'X position',
					rules: [
						{type: 'required'},
						{type: 'wholeNumber'},
						{type: 'min', value: 100},
						{type: 'max', value: config.mapWidth - 100},
					],
				},
				posY: {
					id: 'posy',
					type: 'text',
					value: '',
					label: 'Y position',
					rules: [
						{type: 'required'},
						{type: 'wholeNumber'},
						{type: 'min', value: 100},
						{type: 'max', value: config.mapHeight - 100},
					],
				},
			},
			data: {},
			newId: 0,
			display: {
				id: {type: 'hidden'},
				posX: {pre: 'X: '},
				posY: {pre: 'Y: '},
			},
			renderForm: fields => (
				<React.Fragment>
					<div className="row">
						<div className="col-100">
							<Field config={fields.positionName} />
						</div>
					</div>
					<div className="row">
						<div className="col-100">
							<Field config={fields.posX} />
						</div>
					</div>
					<div className="row">
						<div className="col-100">
							<Field config={fields.posY} />
						</div>
					</div>
				</React.Fragment>
			),
		},
	},
	startingMapItems: {
		id: 'map-items',
		type: 'multiAdd',
		value: [],
		label: 'Starting map items',
		rules: [{type: 'allValidValues'}],
		propOrig: 'startingMapItemsEditor',
		config: {
			fields: {
				selectMapObj: {
					id: 'select-mapobj',
					type: 'select',
					value: '',
					label: 'Map item',
					options: ['', ...allImages, ...allVideos].map((name, index) => {
						const isVideo = index > allImages.length;

						return {
							value: name,
							title: name ? name[0].toUpperCase() + name.slice(1) : 'Select map item',
							icon: isVideo ? 'video'
														: name ? 'painting' : 'default',
							disabled: !name,
						};
					}),
					rules: [
						{type: 'required'},
					],
				},
				mapItemLocation: {
					id: 'location-mapitem',
					type: 'select',
					label: 'Location',
					options: [],
					value: 'pos7',
					rules: [{type: 'required'}],
				},
				posX: {
					id: 'posx',
					type: 'text',
					value: '',
					label: 'X position',
					hidden: {field: 'mapItemLocation', fieldValueNot: 'fixed'},
					rules: [
						{type: 'required'},
						{type: 'wholeNumber'},
						{type: 'min', value: 100},
						{type: 'max', value: config.mapWidth - 100},
					],
				},
				posY: {
					id: 'posy',
					type: 'text',
					value: '',
					label: 'Y position',
					hidden: {field: 'mapItemLocation', fieldValueNot: 'fixed'},
					rules: [
						{type: 'required'},
						{type: 'wholeNumber'},
						{type: 'min', value: 100},
						{type: 'max', value: config.mapHeight - 100},
					],
				},
			},
			getOptionsData: {
				mapItemLocation: data => {
					const fixedPositions = data.positions.map(posObj => ({value: posObj.id,	title: posObj.name}));

					return [{value: 'fixed', title: '- Fixed'}, ...fixedPositions];
				},
			},
			data: {},
			display: {
				mapItemLocation: {pre: 'Location: '},
				posX: {pre: 'X: '},
				posY: {pre: 'Y: '},
			},
			renderForm: fields => (
				<React.Fragment>
					<div className="row">
						<div className="col-100">
							<Field config={fields.selectMapObj} />
						</div>
					</div>
					<div className="row">
						<div className="col-100">
							<Field config={fields.mapItemLocation} />
						</div>
					</div>
					<div className="row">
						<div className="col-100">
							<Field config={fields.posX} />
						</div>
					</div>
					<div className="row">
						<div className="col-100">
							<Field config={fields.posY} />
						</div>
					</div>
				</React.Fragment>
			),
		},
	},
	startingQueueItems: {
		id: 'queue-items',
		type: 'multiAdd',
		value: [],
		label: 'Starting queue items',
		rules: [{type: 'allValidValues'}],
		propOrig: 'startingMapItemsEditor',
		config: {
			fields: {
				selectAction: {
					id: 'select-action',
					type: 'select',
					value: '',
					label: 'Select action',
					options: [
						{value: '', title: 'Select action', icon: 'default', disabled: true},
						{value: 'createEvent', title: 'Create event', icon: 'queue'},
						{value: 'createMapObj', title: 'Create map item', icon: 'map'},
						{value: 'destroyMapObj', title: 'Destroy map item', icon: 'map-remove'},
					],
					rules: [
						{type: 'required'},
					],
				},
				activates: {
					id: 'activates',
					type: 'text',
					value: '',
					label: 'Activates at (turn)',
					hidden: {field: 'selectAction', fieldValue: ''},
					rules: [
						{type: 'required'},
						{type: 'wholeNumber'},
						{type: 'min', value: 1},
					],
				},
				createEvent: {
					id: 'create-event',
					type: 'autocomplete',
					value: '',
					label: 'Select event',
					options: [],
					hidden: {field: 'selectAction', fieldValueNot: 'createEvent'},
					rules: [
						{type: 'required'},
						{type: 'matchOption'},
					],
				},
				selectMapObj: {
					id: 'select-mapobj',
					type: 'select',
					value: '',
					label: 'Map item',
					hidden: {field: 'selectAction', fieldValueNot: ['createMapObj', 'destroyMapObj']},
					options: ['', ...allImages, ...allVideos].map((name, index) => {
						const isVideo = index > allImages.length;

						return {
							value: name,
							title: name ? name[0].toUpperCase() + name.slice(1) : 'Select map item',
							icon: isVideo ? 'video'
														: name ? 'painting' : 'default',
							disabled: !name,
						};
					}),
					rules: [
						{type: 'required'},
					],
				},
				createMapObjLocation: {
					id: 'location-mapobj-create',
					type: 'select',
					label: 'Location',
					hidden: {field: 'selectAction', fieldValueNot: 'createMapObj'},
					options: [],
					value: '',
					rules: [{type: 'required'}, {type: 'matchOption'}],
				},
				destroyMapObjLocation: {
					id: 'location-mapobj-remove',
					type: 'select',
					label: 'Location',
					hidden: {field: 'selectAction', fieldValueNot: 'destroyMapObj'},
					options: [],
					value: 'any',
					rules: [{type: 'required'}, {type: 'matchOption'}],
				},
				noDestroyMapObjAnimation: {
					id: 'no-destroy-mapobj-animation',
					type: 'checkbox',
					value: '',
					label: 'Skip fade out animation',
					checkedValue: 'No animation',
					hidden: {field: 'selectAction', fieldValueNot: 'destroyMapObj'},
					rules: [],
				},
			},
			getOptionsData: {
				createEvent: data => Object.keys(data.events || {})
																.map(eventName => ({
																	value: eventName,
																	title: data.events[eventName].title,
																	icon: data.events[eventName].icon,
																	shape: data.events[eventName].behaviour === 'progress' ? 'rhombus' : 'circle',
																})),
				createMapObjLocation: data => {
					const fixedPositions = data.positions.map(posObj => ({value: posObj.id,	title: posObj.name}));

					return [{value: '', title: 'Select location', disabled: true}, ...fixedPositions];
				},
				destroyMapObjLocation: data => {
					const fixedPositions = data.positions.map(posObj => ({value: posObj.id,	title: posObj.name}));

					return [{value: 'any', title: 'Anywhere'}, ...fixedPositions];
				},
			},
			data: {},
			display: {
				selectAction: {type: 'icon'},
				activates: {pre: 'Turn '},
				createMapObjLocation: {pre: 'Location: '},
				destroyMapObjLocation: {pre: 'Location: '},
			},
			renderForm: fields => (
				<React.Fragment>
					<div className="row">
						<div className="col-100">
							<Field config={fields.selectAction} />
						</div>
					</div>
					<div className="row">
						<div className="col-100">
							<Field config={fields.activates} />
						</div>
					</div>
					<div className="row">
						<div className="col-100">
							<Field config={fields.createEvent} />
							<Field config={fields.selectMapObj} />
						</div>
					</div>
					<div className="row">
						<div className="col-100">
							<Field config={fields.createMapObjLocation} />
							<Field config={fields.destroyMapObjLocation} />
						</div>
					</div>
					<div className="row">
						<div className="col-100">
							<Field config={fields.noDestroyMapObjAnimation} />
						</div>
					</div>
				</React.Fragment>
			),
		},
	},
	conditions: {
		id: 'conditions',
		type: 'multiAdd',
		value: [],
		label: 'Conditions',
		rules: [{type: 'allValidValues'}],
		propOrig: 'conditionsEditor',
		config: {
			fields: {
				id: {
					type: 'hidden',
					rules: [],
					value: '',
					generateValue: config => {
						const val = config.newId + '';

						config.newId++;
						return val;
					},
				},
				condition: {
					id: 'condition',
					type: 'text',
					value: '',
					label: 'Condition',
					rules: [
						{type: 'required'},
					],
				},
				actions: {
					id: 'actions',
					type: 'multiAdd',
					value: [],
					label: 'Actions',
					rules: [{type: 'allValidValues'}],
					config: actionFieldConfigCondition,
				},
			},
			getOptionsData: {
			},
			newId: 0,
			data: {},
			display: {
				id: {type: 'hidden'},
				actions: {iconField: 'selectAction'},
			},
			renderForm: fields => (
				<React.Fragment>
					<div className="row">
						<div className="col-100">
							<Field config={fields.condition} />
						</div>
					</div>
					<div className="row multi-add-row">
						<div className="col-100">
							<Field config={fields.actions} />
						</div>
					</div>
				</React.Fragment>
			),
		},
	}
};

export {
	actionFieldConfig,
	actionFieldConfigCondition,
	eventFields,
	stateFields,
};