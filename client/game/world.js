
import utils from 'utils';
import config from 'config';
import {
	events as allEvents,
	mapVideos as allVideos,
	positions as allPositions,
	startingMapItems,
	startingQueueItems,
	conditions as allConditions,
} from './data/data.json';
import Agent from './agent';

const actionTypes = ['onStart', 'onEnd', 'onPop', 'onNoPop', 'onSuccess', 'onFail', 'onFullProgress'];

const defaultState = {
	events: [],
	queue: startingQueueItems,
	hour: 0,
	day: 1,
	map: startingMapItems,
	positions: allPositions,
	conditions: allConditions,
};

let eventCounter = 0;
let mapCounter = defaultState.map.length;
let conditionCounter = defaultState.conditions.length;

class World extends Agent {

	constructor(subscribeState) {
		super(subscribeState);
		utils.bindThis(this, ['_worldChange', 'eventPop']);

		defaultState.map = defaultState.map.map((mapObj, index) => ({
			state: '',
			animation: '',
			priority: index,
			id: index,
			...mapObj,
			posX: this._getPosValue(mapObj.posX, {positions: allPositions}),
			posY: this._getPosValue(mapObj.posY, {positions: allPositions}),
		}));
		defaultState.queue.forEach(queueObj => {
			if (['createMapObj', 'destroyMapObj'].includes(queueObj.type)) {
				queueObj.value.posX = this._getPosValue(queueObj.value.posX, {positions: allPositions});
				queueObj.value.posY = this._getPosValue(queueObj.value.posY, {positions: allPositions});
			}
		});
		this.state = {};
		this.setState(defaultState);
		this.changeInterval = setInterval(this._worldChange, 250);
	}

	_worldChange() {
		if (this.system.state.paused) {
			return false;
		}
		const hour = this.state.hour + 0.25;
		const day = hour % 24 === 0 ? this.state.day + 1 : this.state.day;

		this.setState({hour, day});
		this.system.updateWorldMessages();
		this.player.changeEnergy(0.25 * this.player.state.energyGainRate);

		if (hour % 1 !== 0) {
			return;
		}

		this.state.conditions.forEach(condition => this.checkCondition(condition));

		for (let i = this.state.events.length - 1; i >= 0; i--) {
			const event = this.state.events[i];

			if (event.starts === hour) {
				this.system.massDispatch(event, 'onStart');
			}
			if (event.ends === hour && !event.ended) {
				this._updateStateObj('events', event.id, {ended: true});
				this.system.massDispatch(event, 'onNoPop');
				this.system.massDispatch(event, 'onEnd');
				if (event.behaviour === 'progress') {
					this.system.massDispatch(event, event.progress >= 100 ? 'onSuccess' : 'onFail');
				}
			}
			if (event.removed || event.ends < hour) {
				this._removeStateObj('events', event.id);
			}
		}

		const queue = this.state.queue.filter(item => {
			if (item.activates === hour) {
				switch (item.type) {
					case 'createEvent':
						this.setState({events: [...this.state.events, this._createEvent(item.value)]});
						break;

					case 'createMapObj':
						this.createMapObj(item.value);
						break;

					case 'destroyMapObj':
						this.destroyMapObj(item.value);
						break;
				}
				return false;
			}
			return true;
		});

		this.setState({queue});
	}

	queueItem({type, value, delay}) {
		const newItem = {type, value, activates: Math.floor(this.state.hour) + utils.getRandom(delay) + 1};
		this.setState({queue: [...this.state.queue, newItem]});
	}

	_getPosValue(value, refs) {
		if (typeof value !== 'string') {
			return value;
		}

		switch (value) {
			case 'eventPosX':
				return refs && refs.event.posX;

			case 'eventPosY':
				return refs && refs.event.posY;

			case 'anyPosX':
			case 'anyPosY':
				return false;

			default:
				const [posObjId, type] = value.split('Pos');
				const findFn = posObj => posObj.id === posObjId;
				// Find object
				const posObj = refs && refs.positions ? refs.positions.find(findFn)
																							: this.state.positions.find(findFn) || this.state.map.find(findFn);

				if (!posObj) {
					console.warn(`Error: no position object found for ${value}.`);
					return false;
				}
				return this._getPosValue(posObj[`pos${type}`]);
		}
	}

	_getSafePos({posX, posY, offsetX, offsetY, range = 0}) {
		posX = this._getPosValue(posX) + (offsetX || 0);
		posY = this._getPosValue(posY) + (offsetY || 0);

		const getDistance = (p1, p2) => Math.abs(Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)));
		const fixedPos = !range && posX && posY;
		const maxTries = 500;
		let unsafe;
		let tries = 0;
		let pos = {};
		let angle, radius;

		do {
			tries++;
			angle =  Math.random() * 2 * Math.PI;
			radius = range * Math.sqrt(Math.random());
			pos.x = posX ? posX + radius * Math.cos(angle) : Math.floor(Math.random() * (config.mapWidth - 200) + 100);
			pos.y = posY ? posY + radius * Math.sin(angle) : Math.floor(Math.random() * (config.mapHeight - 200) + 100);

			unsafe = this.state.positions.some(posObj => getDistance({x: posObj.posX, y: posObj.posY}, pos) < 60);
			unsafe = unsafe || this.state.events.some(event => getDistance({x: event.posX, y: event.posY}, pos) < 60);
			unsafe = unsafe || pos.x < 50 || pos.x > config.mapWidth - 50 || pos.y < 50 || pos.y > config.mapHeight - 50;
		} while (unsafe && tries < maxTries && !fixedPos);

		if (tries === maxTries && unsafe) {
			console.warn('Error: getSafePos failed! Too many tries.');
		}
		return pos;
	}

	_createEvent(eventType) {
		const eventOrig = allEvents[eventType];
		const duration = utils.getRandom(eventOrig.duration);
		const pos = this._getSafePos(eventOrig);
		const event = {...utils.deepClone(eventOrig), ...{
			posX: pos.x,
			posY: pos.y,
			starts: Math.floor(this.state.hour) + 1,
			ends: Math.floor(this.state.hour) + duration + 1,
			duration,
			type: eventType,
			id: eventCounter,
			progress: utils.getRandom(eventOrig.progress),
			ended: false,
		}};

		actionTypes.forEach(actionType => {
			const actions = event[actionType];

			actions && actions.forEach((action, index) => {
				const actionName = Object.keys(action)[0];

				if (typeof action[actionName] !== 'object' || action[actionName] instanceof Array) {
					return;
				}
				action[actionName].posX = this._getPosValue(action[actionName].posX, {event});
				action[actionName].posY = this._getPosValue(action[actionName].posY, {event});
				if (actionName === 'queueItem' && action[actionName].value.posX) {
					action[actionName].value.posX = this._getPosValue(action[actionName].value.posX, {event});
					action[actionName].value.posY = this._getPosValue(action[actionName].value.posY, {event});
				}
			});
		});

		eventCounter++;
		return event;
	}

	removeAllEventsByType(...eventTypes) {
		const queue = this.state.queue.filter(item => item.type !== 'createEvent' || !eventTypes.includes(item.value));
		const events = this.state.events.map(event => eventTypes.includes(event.type) ? {...event, onEnd: [], ended: true} : event);

		this.setState({queue, events});
	}

	eventPop(eventId) {
		const event = this.state.events.find(event => event.id === eventId);

		this.system.playSound('click');

		if (!event || event.ended) {
			return;
		}
		if (this.player.state.energy < event.energy) {
			return this.system.createMessage({type: 'notEnoughEnergy', name: event.title, value: event.energy});
		}


		this.player.changeEnergy(-event.energy);
		this._updateStateObj('events', event.id, {ended: true});
		setTimeout(() => this._updateStateObj('events', event.id, {removed: true}), 1000);
		this.system.massDispatch(event, 'onPop');
		this.system.massDispatch(event, 'onEnd');
		this.increaseProgress(event.type);
	}

	createMapObj(mapObj) {
		const priority = allVideos.indexOf(mapObj.name) > -1 ? mapCounter * 1000 : mapCounter;
		const newObj = {id: mapCounter, animation: 'create', state: '', priority, ...mapObj};

		newObj.posX = this._getPosValue(newObj.posX) + (newObj.offsetX || 0);
		newObj.posY = this._getPosValue(newObj.posY) + (newObj.offsetY || 0);
		mapCounter++;
		this.setState({map: [...this.state.map, newObj]});
	}

	destroyMapObj(obj) {
		const mapItem = this.state.map.find(mapObj => {
			return mapObj.name === obj.name && (!obj.posX || obj.posX === mapObj.posX && obj.posY === mapObj.posY);
		});

		if (mapItem) {
			obj.noAnimation ? this.removeMapObj(mapItem.id) : this.updateMapObj(mapItem.id, {animation: 'destroy'});
		}
	}

	updateMapObj(id, update) {
		this._updateStateObj('map', id, update);
	}

	removeMapObj(id) {
		this._removeStateObj('map', id);
	}

	removeCondition(id) {
		this._removeStateObj('conditions', id);
	}

	checkCondition(condition, eventType, action) {
		if (condition.requiredEvent && !eventType ||
			condition.requiredEvent && eventType &&
				(condition.requiredEvent.type !== eventType || condition.requiredEvent.action !== action) ||
			!condition.requiredEvent && eventType) {
			return;
		}

		const parts = condition.requires
															.replace(/(\[|\]\.)/g, '.')
															.replace(/(\s|\'|\")/g, '')
															.split(/(\s|>=|==|===|<=|<|>|includes|\.)/g);
		const compare = {sides: [], operator: ''};
		const agents = [this, this.player, this.system];
		const compareSides = () => {
			switch (compare.operator) {
				case '<': return compare.sides[0] < compare.sides[1];
				case '<=': return compare.sides[0] <= compare.sides[1];
				case '>': return compare.sides[0] > compare.sides[1];
				case '>=': return compare.sides[0] >= compare.sides[1];
				case '==': return compare.sides[0] == compare.sides[1];
				case '===': return compare.sides[0] === compare.sides[1];
				case 'includes': return compare.sides[0] instanceof Array && compare.sides[0].includes(compare.sides[1]);
			}
		};
		let stateProp;

		parts.forEach((part, i) => {
			if (['', ' ', '.'].includes(part)) {
				return;
			}
			if (typeof +part === 'number' && !isNaN(+part)) {
				compare.sides.push(+part);
			} else if (/(>=|==|===|<=|<|>|includes)/g.test(part)) {
				compare.operator = part;
			} else {
				if (typeof stateProp === 'undefined') {
					const agent = agents.find(agent => agent.state.hasOwnProperty(part));

					if (!agent && compare.operator !== 'includes') {
						return console.warn(`Error: '${condition.requires}' is not a valid condition.`);
					}
					stateProp = compare.operator === 'includes' ? part : agent.state[part];
				} else {
					stateProp = stateProp[part];
				}
				if (typeof stateProp !== 'undefined' && parts[i + 1] !== '.') {
					compare.sides.push(stateProp);
					stateProp = undefined;
				}
			}
		});
		if (compareSides()) {
			this.system.massDispatch(condition.actions);
		}
	}

	increaseProgress(type) {
		const reachedFull = [];
		const events = this.state.events.map(event => {
			if (event.hasOwnProperty('progress') && event.progressIncrease && event.progressIncrease[type] && !event.ended) {
				const newProgress = Math.min(event.progress + utils.getRandom(event.progressIncrease[type]), 100);

				if (event.progress < 100 && newProgress === 100) {
					reachedFull.push(event.id);
				}
				return {...event, progress: newProgress};
			} else {
				return event;
			}
		});

		this.setState({events});
		reachedFull.forEach(id => this.system.massDispatch(events.find(event => event.id === id), 'onFullProgress'));
	}
};

export {
	actionTypes,
	defaultState,
};

export default World;
