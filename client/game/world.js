
import utils from 'utils';
import config from 'config';
import allEvents from './data/events';
import Agent from './agent';
import allAssets from './data/assets';

const actionTypes = ['onStart', 'onEnd', 'onAction', 'onNoAction', 'onSuccess', 'onFail', 'onFullChance'];

const defaultState = {
	events: [],
	queue: [
		{type: 'createEvent', value: 'water', activates: 3,},
		{type: 'createEvent', value: 'life', activates: 8,},
		{type: 'createEvent', value: 'earth', activates: 11,},
		{type: 'createEvent', value: 'water', activates: 2,},
		{type: 'createEvent', value: 'life', activates: 7,},
		{type: 'createEvent', value: 'earth', activates: 2,},
		{type: 'createEvent', value: 'inspireFarming', activates: 1},
		{type: 'createMapObj', value: {name: 'village', posX: 900, posY: 280}, activates: 1},
	],
	hour: 0,
	day: 1,
	map: [{id: 0, name: 'island',	posX: 600, posY: 450,	animation: '', state: ''}],
	positions: [{name: 'village', posX: 900, posY: 280}],
	conditions: [
		{
			id: 0,
			requires: 'motes.life >= 3',
			actions: [
				{createMapObj: {name: 'forest', posX: 685, posY: 440,}},
				{createMessage: {type: 'free', name: 'A forest evolved from high natural activity.'}},
				{removeCondition: 0},
			],
		},
	],
};

let eventCounter = 0;
let mapCounter = 1;
let conditionCounter = 1;

class World extends Agent {

	constructor(subscribeState) {
		super(subscribeState);
		utils.bindThis(this, ['_worldChange', 'eventAction']);
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

		const forest = this.state.map.find(obj => obj.name === 'forest2');

		if (forest) {

			if (hour % 3 === 1) {
				this._updateStateObj('map', forest.id, {animation: 'hide'});
			}
			if (hour % 3 === 0) {
				this._updateStateObj('map', forest.id, {animation: 'show', state: ''});
			}
		}

		this.state.conditions.forEach(condition => this.checkCondition(condition));

		for (let i = this.state.events.length - 1; i >= 0; i--) {
			const event = this.state.events[i];

			if (event.starts === hour) {
				this.system.massDispatch(event.onStart);
			}
			if (event.ends === hour && !event.ended) {
				this._updateStateObj('events', event.id, {ended: true});
				this.system.massDispatch(event.onNoAction);
				this.system.massDispatch(event.onEnd);
				if (event.hasOwnProperty('chance')) {
					this.system.massDispatch(event.chance >= 100 ? event.onSuccess : event.onFail);
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
				}
				return false;
			}
			return true;
		});

		this.setState({queue});
	}

	queueItem({type, value, delay}) {
		const newItem = {type, value, activates: Math.floor(this.state.hour) + utils.getRandom(delay) + 1,};
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

			default:
				const [posObjName, type] = value.split('Pos');
				const findFn = posObj => posObj.name === posObjName;
				// Find object
				const posObj = this.state.positions.find(findFn) || this.state.map.find(findFn);

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
			chance: utils.getRandom(eventOrig.chance),
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

	eventAction(eventId) {
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
		this.system.massDispatch(event.onAction);
		this.system.massDispatch(event.onEnd);
		this.increaseChance(event.type);
	}

	createMapObj(mapObj) {
		const priority = allAssets.videos[mapObj.name] ? mapCounter * 1000 : mapCounter;
		const newObj = {id: mapCounter, animation: 'create', state: '', priority, ...mapObj};

		newObj.posX = this._getPosValue(newObj.posX) + (newObj.offsetX || 0);
		newObj.posY = this._getPosValue(newObj.posY) + (newObj.offsetY || 0);
		mapCounter++;
		this.setState({map: [...this.state.map, newObj]});
	}

	updateMapObj(id, update) {
		this._updateStateObj('map', id, update);
	}

	removeMapObj(id) {
		this._removeStateObj('map', id);
	}

	removeCondition(id) {
		if (typeof id === 'number') {
			this._removeStateObj('conditions', id);
		} else if (allEvents[id]) {
			actionTypes.forEach(actionType => allEvents[id][actionType] && allEvents[id][actionType].forEach((actionObj, index) => {
				if (actionObj.hasOwnProperty('checkCondition')) {
					allEvents[id][actionType].splice(index, 1);
				}
			}));
		}
	}

	checkCondition(condition) {
		const parts = condition.requires.replace(/(\[\')/g, '').replace(/(\'\])/g, '.').split(/(\s|>=|==|===|<=|<|>|\.)/g);
		const compare = {sides: [], operator: ''};
		const agents = [this, this.player, this.system];
		const matchSides = () => {
			switch (compare.operator) {
				case '<': return compare.sides[0] < compare.sides[1];
				case '<=': return compare.sides[0] <= compare.sides[1];
				case '>': return compare.sides[0] > compare.sides[1];
				case '>=': return compare.sides[0] >= compare.sides[1];
				case '==': return compare.sides[0] == compare.sides[1];
				case '===': return compare.sides[0] === compare.sides[1];
			}
		};
		let stateProp;

		parts.forEach((part, i) => {
			if (['', ' ', '.'].indexOf(part) > -1) {
				return;
			}
			if (typeof +part === 'number' && !isNaN(+part)) {
				compare.sides.push(+part);
			} else if (/(>=|==|===|<=|<|>)/g.test(part)) {
				compare.operator = part;
			} else {
				if (typeof stateProp === 'undefined') {
					const agent = agents.find(agent => agent.state.hasOwnProperty(part));

					if (!agent) {
						return console.warn(`Error: '${condition.requires}' is not a valid condition.`);
					}
					stateProp = agent.state[part];
				} else {
					stateProp = stateProp[part];
					if (parts[i + 1] !== '.') {
						compare.sides.push(stateProp);
						stateProp = undefined;
					}
				}
			}
		});
		if (matchSides()) {
			this.system.massDispatch(condition.actions);
		}
	}

	increaseChance(type) {
		const reachedFull = [];
		const events = this.state.events.map(event => {
			if (event.hasOwnProperty('chance') && event.chanceIncrease && event.chanceIncrease[type] && !event.ended) {
				const newChance = Math.min(event.chance + utils.getRandom(event.chanceIncrease[type]), 100);

				if (event.chance < 100 && newChance === 100) {
					reachedFull.push(event.id);
				}
				return {...event, chance: newChance};
			} else {
				return event;
			}
		});

		this.setState({events});
		reachedFull.forEach(id => this.system.massDispatch(events.find(event => event.id === id).onFullChance));
	}
};

export default World;
