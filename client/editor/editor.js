
import Agent from '../game/agent';
import {actionTypes} from '../game/world';
import {actionFieldConfig, stateFields} from './editor-screen-fields';

import utils from 'utils';


class Editor extends Agent {

	constructor(subscribeState) {
		super(subscribeState);
		utils.bindThis(this, ['_saveEvent', '_saveState']);

		this.state = {};
		this.subscribeSave = {};
		this.saving = false;
		this.saveQueue = {};
		this.debounceSaveEvent = utils.debounce(this._saveEvent, 500);
		this.debounceSaveState = utils.debounce(this._saveState, 500);

		this._loadData();
	}

	_ajax({url, type, data, params}) {
		return new Promise((resolve, reject) => {
			const request = new XMLHttpRequest();
			let paramStr = '';

			if (params) {
				for (let key in params) {
					paramStr += paramStr.length > 0 ? '&' : '?';
					paramStr += `${key}=${encodeURIComponent(params[key])}`;
				}
			}

			request.onreadystatechange = () => {
				if (request.readyState === XMLHttpRequest.DONE && request.status === 200) {
					const data = JSON.parse(request.response);
					resolve(data);
				}
			};

			request.open(type ? type.toUpperCase() : 'GET', url + paramStr);
			request.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
			request.send(data && JSON.stringify(data));
		});
	}

	_getOptionVal(fieldName, value, data, config) {
		config = config || actionFieldConfig;
		const options = data && config.getOptionsData[fieldName](data) || config.fields[fieldName].options;
		const option = options.find(option => option.value === value) || {value};
		return {[fieldName]: option};
	}

	_actionToEditor(event, data) {
		const returnObj = {};

		actionTypes.forEach(actionType => {
			returnObj[`${actionType}Editor`] = [];

			event[actionType] && event[actionType].forEach((action, index) => {
				const actionName = Object.keys(action)[0];
				const actionValue = action[actionName];
				let obj;

				switch (actionName) {
					case 'changeBoxAttr':
					case 'setBoxAttr':
						obj = {
							...this._getOptionVal('selectAction', 'boxAttrs'),
							boxName: actionValue[0],
							...this._getOptionVal('boxActionType', actionName === 'changeBoxAttr' ? 'change' : 'set'),
							boxValue: actionValue[1] + '',
						};
						break;

					case 'queueItem':
						if (actionValue.type === 'createEvent') {
							obj = {
								...this._getOptionVal('selectAction', 'queueEvent'),
								...this._getOptionVal('queueEvent', actionValue.value, data),
								delayEvent: actionValue.delay + '',
							};
						} else if (['createMapObj', 'destroyMapObj'].includes(actionValue.type)) {
							obj = {
								...this._getOptionVal('selectAction', actionValue.type),
								...this._getOptionVal('selectMapObj', actionValue.value.name),
								...this._getOptionVal(`${actionValue.type}Location`, actionValue.value.posX.split('PosX')[0]),
								delayMapObj: actionValue.delay + '',
								noAnimation: actionValue.noAnimation,
							};
						}
						break;

					case 'changeMaxEnergy':
					case 'changeEnergy':
					case 'changeEnergyGainRate':
					case 'gainSkillPoints':
						obj = {
							...this._getOptionVal('selectAction', 'playerAttrs'),
							...this._getOptionVal('playerAttrs', actionName),
							[actionName === 'gainSkillPoints' ? 'playerAttrWhole' : 'playerAttrValue']: actionValue + '',
						};
						break;

					case 'createMapObj':
					case 'destroyMapObj':
						obj = {
							...this._getOptionVal('selectAction', actionName),
							...this._getOptionVal('selectMapObj', actionValue.name),
							...this._getOptionVal(`${actionName}Location`, actionValue.posX.split('PosX')[0]),
							delayMapObj: '',
							noDestroyMapObjAnimation: actionValue.noAnimation ? actionFieldConfig.fields.noDestroyMapObjAnimation.checkedValue : '',
						};
						break;

					case 'removeAllEventsByType':
						obj = {
							...this._getOptionVal('selectAction', 'removeEvents'),
							removeEvents: actionValue.map(eventName => this._getOptionVal('removeEvents', eventName, data).removeEvents),
						};
						break;

					case 'createMessage':
						const eventShape = event.behaviour === 'progress' ? 'rhombus' : 'circle';
						const isMatchEvent = actionValue.icon === event.icon && actionValue.shape === eventShape;
						obj = {
							...this._getOptionVal('selectAction', 'createMessage'),
							messageTitle: actionValue.name,
							...this._getOptionVal('messageIconShape', isMatchEvent 	? 'matchEvent'
																																: !actionValue.icon ? 'noIcon' : actionValue.shape),
							...(isMatchEvent 	? {messageIcon: {value: event.icon, icon: event.icon, shape: eventShape}}
																: !actionValue.icon ? {} : {
																		messageIcon: {
																			...this._getOptionVal('messageIcon', actionValue.icon).messageIcon,
																			...{shape: actionValue.shape},
																		}
																	}),
							messageDesc: actionValue.descVal,
						};
						break;
				}

				if (obj) {
					obj._index = index + 1;
					obj._isValid = true;
					returnObj[`${actionType}Editor`].push(obj);
				}
			});
		});
		return returnObj;
	}

	_actionToGame(sendEvent) {
		actionTypes.forEach(actionType => {
			if (sendEvent.behaviour === 'pop' && ['onSuccess', 'onFail', 'onFullProgress'].includes(actionType) ||
				sendEvent.behaviour === 'progress' && ['onPop', 'onNoPop'].includes(actionType)) {
				delete sendEvent[`${actionType}Editor`];
				delete sendEvent[`${actionType}`];
				return;
			}
			sendEvent[actionType] = [];

			sendEvent[`${actionType}Editor`].forEach(actionObj => {
				let obj;

				switch (actionObj.selectAction.value) {
					case 'queueEvent':
						obj = {
							queueItem: {type: 'createEvent', value: actionObj.queueEvent.value, delay: actionObj.delayEvent}
						};
						break;

					case 'removeEvents':
						obj = {
							removeAllEventsByType: actionObj.removeEvents.map(eventObj => eventObj.value)
						};
						break;

					case 'createMapObj':
					case 'destroyMapObj':
						const actionName = actionObj.selectAction.value;
						const mapObj = {
							name: actionObj.selectMapObj.value,
							posX: actionObj[`${actionName}Location`].value + 'PosX',
							posY: actionObj[`${actionName}Location`].value + 'PosY',
							noAnimation: actionName === 'destroyMapObj' && !!actionObj.noDestroyMapObjAnimation,
						};
						obj = actionObj.delayMapObj ? {queueItem: {type: actionName, delay: actionObj.delayMapObj, value: mapObj}}
																				: {[actionName]: mapObj};
						break;

					case 'createMessage':
						const isMatchEvent = actionObj.messageIconShape.value === 'matchEvent';
						const eventShape = sendEvent.behaviour === 'progress' ? 'rhombus' : 'circle';
						const icon = actionObj.messageIconShape.value !== 'noIcon' && (isMatchEvent ? sendEvent.icon : actionObj.messageIcon.value);
						const shape = icon && isMatchEvent ? eventShape : icon && actionObj.messageIconShape.value;

						obj = {
							createMessage: {
								type: actionObj.messageDesc || icon ? 'primary' : 'free',
								name: actionObj.messageTitle,
								descVal: actionObj.messageDesc,
								icon,
								shape,
							}
						};
						break;

					case 'playerAttrs':
						obj = {[actionObj.playerAttrs.value]: actionObj.playerAttrs.value === 'gainSkillPoints' ? +actionObj.playerAttrWhole
																																																		: +actionObj.playerAttrValue};
						break;

					case 'boxAttrs':
						obj = {
							[actionObj.boxActionType.value === 'set' ? 'setBoxAttr' : 'changeBoxAttr']: [actionObj.boxName, +actionObj.boxValue]
						};
				}
				obj && sendEvent[actionType].push(obj);
			});
			delete sendEvent[`${actionType}Editor`];
		});
	}

	_loadData() {
		this._ajax({url: '/get-data'}).then(data => {
			Object.keys(data.events).forEach(eventName => {
				const event = data.events[eventName];
				const progressIncreaseEditor = !event.progressIncrease ? [] : Object.keys(event.progressIncrease).map((matchEventName, index) => {
					const matchEvent = data.events[matchEventName];

					return {
						progressEvent: matchEvent ? {
							value: matchEventName,
							title: matchEvent.title,
							icon: matchEvent.icon,
							shape: 'circle',
						} : `??${matchEventName}`,
						increase: event.progressIncrease[matchEventName] + '',
						_index: index + 1,
						_isValid: !!matchEvent,
					}
				});

				data.events[eventName] = {
					...event,
					behaviour: typeof event.progress === 'undefined' ? 'pop' : 'progress',
					icon: event.icon || data.icons.find(icon => icon === event.title.toLowerCase().replace(/ /g, '-')) || 'default',
					progress: ['number', 'string'].includes(typeof event.progress) ? event.progress + '' : '',
					location: event.posX && isNaN(+event.posX) 	? event.posX.split('PosX')[0]
																											: event.posX > 0 ? 'fixed' : 'any',
					duration: event.duration + '',
					energy: event.energy ? event.energy + '' : '',
					posX: typeof event.posX === 'string' ? event.posX : '',
					posY: typeof event.posY === 'string' ? event.posY : '',
					fixedPosX: isNaN(+event.posX) ? '100' : event.posX + '',
					fixedPosY: isNaN(+event.posY) ? '100' : event.posY + '',
					offsetX: event.offsetX ? event.offsetX + '' : '',
					offsetY: event.offsetX ? event.offsetY + '' : '',
					range: event.range ? event.range + '' :'',
					progressIncreaseEditor,
				};
			});

			// Convert actionObjects last as these might rely on editor generated values
			for (let eventName in data.events) {
				data.events[eventName] = {
					...data.events[eventName],
					...this._actionToEditor(data.events[eventName], data),
				};
			}

			// State
			data.positionsEditor = data.positions.map((posObj, index) => ({
				id: posObj.id,
				positionName: posObj.name,
				posX: posObj.posX + '',
				posY: posObj.posY + '',
				_index: index + 1,
				_isValid: true,
			}));

			data.startingMapItemsEditor = data.startingMapItems.map((mapObj, index) => {
				const location = typeof mapObj.posX === 'number' ? 'fixed' : mapObj.posX.split('PosX')[0];
				return {
					...this._getOptionVal('selectMapObj', mapObj.name, null, stateFields.startingMapItems.config),
					...this._getOptionVal('mapItemLocation', location, data, stateFields.startingMapItems.config),
					posX: typeof mapObj.posX === 'number' ? mapObj.posX + '' : '',
					posY: typeof mapObj.posY === 'number' ? mapObj.posY + '' : '',
					_index: index + 1,
					_isValid: true,
				};
			});

			data.startingQueueItemsEditor = data.startingQueueItems.map((queueObj, index) => {
				const createEventFn = () => this._getOptionVal('createEvent', queueObj.value, data, stateFields.startingQueueItems.config);
				const selectMapObjFn = () => this._getOptionVal('selectMapObj', queueObj.value.name, null, stateFields.startingQueueItems.config);
				const createMapObjLocationFn = () => this._getOptionVal('createMapObjLocation', queueObj.value.posX.split('PosX')[0], data, stateFields.startingQueueItems.config);
				const destroyMapObjLocationFn = () => this._getOptionVal('destroyMapObjLocation', queueObj.value.posX.split('PosX')[0], data, stateFields.startingQueueItems.config);

				return {
					...this._getOptionVal('selectAction', queueObj.type, null, stateFields.startingQueueItems.config),
					activates: queueObj.activates + '',
					...(queueObj.type === 'createEvent' ? createEventFn() : {}),
					...(['createMapObj', 'destroyMapObj'].includes(queueObj.type) ? selectMapObjFn() : {}),
					...(queueObj.type === 'createMapObj' ? createMapObjLocationFn() : {}),
					...(queueObj.type === 'destroyMapObj' ? destroyMapObjLocationFn() : {}),
					...(queueObj.type === 'destroyMapObj' ? {noDestroyMapObjAnimation: queueObj.value.noAnimation} : {}),
					_index: index + 1,
					_isValid: true,
				};
			});

			this.setState({
				...data,
			});
		});
	}

	saveEvent(type, eventObj) {
		return new Promise((resolve, reject) => {
			this.subscribeSave[type] = this.subscribeSave[type] || [];
			this.subscribeSave[type].push(event => resolve(event));
			if (this.saving && this.saving !== type) {
				this.saveQueue[type] = eventObj;
			} else {
				this.saving = type;
				this.debounceSaveEvent(type, eventObj);
			}
		});
	}

	_saveEvent(type, eventObj) {
		const sendEvent = {...eventObj};

		switch (sendEvent.behaviour) {
			case 'progress':
				delete sendEvent.energy;
				sendEvent.progress = sendEvent.progress ? +sendEvent.progress : 0;
				sendEvent.progressIncrease = sendEvent.progressIncreaseEditor.reduce((obj, valObj) => {
					return obj = {...obj, [valObj.progressEvent.value]: valObj.increase};
				}, {});
				break;

			case 'pop':
				delete sendEvent.progress;
				delete sendEvent.progressIncrease;
				sendEvent.energy = sendEvent.energy ? sendEvent.energy : 0;
				break;
		}
		delete sendEvent.progressIncreaseEditor;

		switch (sendEvent.location) {
			case 'any':
				delete sendEvent.posX;
				delete sendEvent.posY;
				delete sendEvent.offsetX;
				delete sendEvent.offsetY;
				delete sendEvent.range;
				break;

			case 'fixed':
				sendEvent.posX = +sendEvent.fixedPosX;
				sendEvent.posY = +sendEvent.fixedPosY;
				delete sendEvent.offsetX;
				delete sendEvent.offsetY;
				sendEvent.range ? sendEvent.range = +sendEvent.range : delete sendEvent.range;
				break;

			default:
				sendEvent.posX = `${sendEvent.location}PosX`;
				sendEvent.posY = `${sendEvent.location}PosY`;
				sendEvent.offsetX ? sendEvent.offsetX = +sendEvent.offsetX : delete sendEvent.offsetX;
				sendEvent.offsetY ? sendEvent.offsetY = +sendEvent.offsetY : delete sendEvent.offsetY;
				sendEvent.range ? sendEvent.range = +sendEvent.range : delete sendEvent.range;
		}
		delete sendEvent.location;
		delete sendEvent.fixedPosX;
		delete sendEvent.fixedPosY;

		this._actionToGame(sendEvent);

		this.saving = '!!inProgress';
		this._ajax({url: '/save-event', type: 'post', data: {[type]: sendEvent}}).then(eventObj => {
			const nextSave = Object.keys(this.saveQueue)[0];

			if (!this.saveQueue[type]) {
				this.subscribeSave[type].forEach(fn => fn(eventObj));
				this.subscribeSave[type] = [];
			}
			if (nextSave) {
				this.saving = nextSave;
				nextSave === '!!state' 	? this.debounceSaveState(this.saveQueue[nextSave])
																: this.debounceSaveEvent(nextSave, this.saveQueue[nextSave]);
				delete this.saveQueue[nextSave];
			} else {
				this.saving = false;
			}
		});
	}

	removeEvent(type) {
		return new Promise(resolve => {
			this._ajax({url: '/remove-event', params: {type}}).then(resolve);
		});
	}

	saveState(newStateObj) {
		const type = '!!state';
		return new Promise((resolve, reject) => {
			this.subscribeSave[type] = this.subscribeSave[type] || [];
			this.subscribeSave[type].push(event => resolve(event));
			if (this.saving && this.saving !== type) {
				this.saveQueue[type] = newStateObj;
			} else {
				this.saving = type;
				this.debounceSaveState(newStateObj);
			}
		});
	}

	_saveState(newStateObj) {
		const type = '!!state';
		const sendState = {...newStateObj};

		if (newStateObj.positionsEditor) {
			sendState.positions = sendState.positionsEditor.map(posObj => ({
				id: posObj.id,
				name: posObj.positionName,
				posX: +posObj.posX,
				posY: +posObj.posY,
			}));
			delete sendState.positionsEditor;
		}

		if (newStateObj.startingMapItemsEditor) {
			sendState.startingMapItems = sendState.startingMapItemsEditor.map(mapObj => ({
				name: mapObj.selectMapObj.value,
				posX: mapObj.mapItemLocation.value === 'fixed' ? +mapObj.posX : mapObj.mapItemLocation.value + 'PosX',
				posY: mapObj.mapItemLocation.value === 'fixed' ? +mapObj.posY : mapObj.mapItemLocation.value + 'PosY',
			}));
			delete sendState.startingMapItemsEditor;
		}

		if (newStateObj.startingQueueItemsEditor) {
			sendState.startingQueueItems = sendState.startingQueueItemsEditor.map(queueObj => {
				const selectAction = queueObj.selectAction.value;
				const locationField = selectAction === 'createMapObj' ? 'createMapObjLocation' : 'destroyMapObjLocation';
				let value = selectAction === 'createEvent' ? queueObj.createEvent.value : {
					name: queueObj.selectMapObj.value,
					posX: queueObj[locationField].value + 'PosX',
					posY: queueObj[locationField].value + 'PosY',
					...(selectAction === 'destroyMapObj' && queueObj.noDestroyMapObjAnimation ? {noAnimation: true} : {})
				};

				return {type: queueObj.selectAction.value, value, activates: +queueObj.activates};
			});
			delete sendState.startingQueueItemsEditor;
		}

		this.saving = '!!inProgress';
		this._ajax({url: '/save-state', type: 'post', data: sendState}).then(stateObj => {
			const nextSave = Object.keys(this.saveQueue)[0];

			if (!this.saveQueue[type]) {
				this.subscribeSave[type].forEach(fn => fn(stateObj));
				this.subscribeSave[type] = [];
			}
			if (nextSave) {
				this.saving = nextSave;
				nextSave === type ? this.debounceSaveState(this.saveQueue[nextSave])
													: this.debounceSaveEvent(nextSave, this.saveQueue[nextSave]);
				delete this.saveQueue[nextSave];
			} else {
				this.saving = false;
			}
		});

	}
}

export default Editor;
