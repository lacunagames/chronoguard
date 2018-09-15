
import Agent from '../game/agent';
import {actionTypes} from '../game/world';
import {actionFieldConfig} from './editor-screen-fields';

import utils from 'utils';


class Editor extends Agent {

	constructor(subscribeState) {
		super(subscribeState);
		utils.bindThis(this, ['_saveEvent']);

		this.state = {};
		this.subscribeSave = {};
		this.saving = false;
		this.saveQueue = {};
		this.debounceSave = utils.debounce(this._saveEvent, 500);

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

	_actionToEditor(event, data) {
		const returnObj = {};
		const getOptionVal = (fieldName, value, data) => {
			const options = data && actionFieldConfig.getOptionsData[fieldName](data) || actionFieldConfig.fields[fieldName].options;
			const option = options.find(option => option.value === value) || {value};
			return {[fieldName]: option};
		}

		actionTypes.forEach(actionType => {
			const arr = returnObj[`${actionType}Editor`] = [];

			event[actionType] && event[actionType].forEach((action, index) => {
				const actionName = Object.keys(action)[0];
				const actionValue = action[actionName];
				let obj;

				switch (actionName) {
					case 'changeBoxAttr':
					case 'setBoxAttr':
						obj = {
							...getOptionVal('selectAction', 'boxAttrs'),
							boxName: actionValue[0],
							...getOptionVal('boxActionType', actionName === 'changeBoxAttr' ? 'change' : 'set'),
							boxValue: actionValue[1] + '',
						};
						break;

					case 'queueItem':
						if (actionValue.type === 'createEvent') {
							obj = {
								...getOptionVal('selectAction', 'queueEvent'),
								...getOptionVal('queueEvent', actionValue.value, data),
								delayEvent: actionValue.delay + '',
							};
						} else if (['createMapObj', 'destroyMapObj'].includes(actionValue.type)) {
							obj = {
								...getOptionVal('selectAction', actionValue.type),
								...getOptionVal('selectMapObj', actionValue.value.name),
								...getOptionVal(`${actionValue.type}Location`, actionValue.value.posX.split('PosX')[0]),
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
							...getOptionVal('selectAction', 'playerAttrs'),
							...getOptionVal('playerAttrs', actionName),
							[actionName === 'gainSkillPoints' ? 'playerAttrWhole' : 'playerAttrValue']: actionValue + '',
						};
						break;

					case 'createMapObj':
					case 'destroyMapObj':
						obj = {
							...getOptionVal('selectAction', actionName),
							...getOptionVal('selectMapObj', actionValue.name),
							...getOptionVal(`${actionName}Location`, actionValue.posX.split('PosX')[0]),
							delayMapObj: '',
							noDestroyMapObjAnimation: actionValue.noAnimation ? actionFieldConfig.fields.noDestroyMapObjAnimation.checkedValue : '',
						};
						break;

					case 'removeAllEventsByType':
						obj = {
							...getOptionVal('selectAction', 'removeEvents'),
							removeEvents: actionValue.map(eventName => getOptionVal('removeEvents', eventName, data).removeEvents),
						};
						break;

					case 'createMessage':
						const eventShape = event.behaviour === 'progress' ? 'rhombus' : 'circle';
						const isMatchEvent = actionValue.icon === event.icon && actionValue.shape === eventShape;
						obj = {
							...getOptionVal('selectAction', 'createMessage'),
							messageTitle: actionValue.name,
							...getOptionVal('messageIconShape', isMatchEvent 	? 'matchEvent'
																																: !actionValue.icon ? 'noIcon' : actionValue.shape),
							...(isMatchEvent 	? {messageIcon: {value: event.icon, icon: event.icon, shape: eventShape}}
																: !actionValue.icon ? {} : {
																		messageIcon: {
																			...getOptionVal('messageIcon', actionValue.icon).messageIcon,
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
					arr.push(obj);
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
					location: event.posX && isNaN(+event.posX) ? event.posX.split('PosX')[0] : event.posX > 0 ? 'fixed' : 'any',
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
				this.debounceSave(type, eventObj);
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

		this.saving = '!inProgress';
		this._ajax({url: '/save-event', type: 'post', data: {[type]: sendEvent}}).then(eventObj => {
			const nextSave = Object.keys(this.saveQueue)[0];

			if (!this.saveQueue[type]) {
				this.subscribeSave[type].forEach(fn => fn(eventObj));
				this.subscribeSave[type] = [];
			}
			if (nextSave) {
				this.saving = nextSave;
				this.debounceSave(nextSave, this.saveQueue[nextSave]);
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
}

export default Editor;
