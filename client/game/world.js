
import utils from 'utils';
import config from 'config';
import allEvents from './data/events';
import Agent from './agent';
import allAssets from './data/assets';

const actionTypes = ['onEnd', 'onAction', 'onSuccess', 'onFail'];

const defaultState = {
	events: [],
	queue: [
		{type: 'createEvent', value: 'fire', activates: utils.getRandom('1-2'),},
		// {type: 'createEvent', value: 'fire', activates: utils.getRandom('1-2'),},
		// {type: 'createEvent', value: 'fire', activates: utils.getRandom('1-2'),},
		// {type: 'createEvent', value: 'fire', activates: utils.getRandom('1-2'),},
		// {type: 'createEvent', value: 'fire', activates: utils.getRandom('1-2'),},
		// {type: 'createEvent', value: 'fire', activates: utils.getRandom('1-2'),},
		// {type: 'createEvent', value: 'fire', activates: utils.getRandom('1-2'),},
		// {type: 'createEvent', value: 'fire', activates: utils.getRandom('1-2'),},
		// {type: 'createEvent', value: 'fire', activates: utils.getRandom('1-2'),},
		// {type: 'createEvent', value: 'fire', activates: utils.getRandom('1-2'),},
		// {type: 'createEvent', value: 'fire', activates: utils.getRandom('1-2'),},
		// {type: 'createEvent', value: 'fire', activates: utils.getRandom('1-2'),},
		// {type: 'createEvent', value: 'fire', activates: utils.getRandom('1-2'),},
		// {type: 'createEvent', value: 'fire', activates: utils.getRandom('1-2'),},
		// {type: 'createEvent', value: 'fire', activates: utils.getRandom('1-2'),},
		// {type: 'createEvent', value: 'fire', activates: utils.getRandom('1-2'),},
		// {type: 'createEvent', value: 'fire', activates: utils.getRandom('1-2'),},
		// {type: 'createEvent', value: 'fire', activates: utils.getRandom('1-2'),},
		// {type: 'createEvent', value: 'fire', activates: utils.getRandom('1-2'),},
		// {type: 'createEvent', value: 'fire', activates: utils.getRandom('1-2'),},
		// {type: 'createEvent', value: 'fire', activates: utils.getRandom('1-2'),},
		// {type: 'createEvent', value: 'fire', activates: utils.getRandom('1-2'),},
		{type: 'createEvent', value: 'water', activates: 3,},
		{type: 'createEvent', value: 'air', activates: 4,},
		{type: 'createEvent', value: 'life', activates: 8,},
		{type: 'createEvent', value: 'earth', activates: 11,},
		{type: 'createEvent', value: 'fire', activates: 3,},
		{type: 'createEvent', value: 'water', activates: 2,},
		{type: 'createEvent', value: 'air', activates: 6,},
		{type: 'createEvent', value: 'life', activates: 7,},
		{type: 'createEvent', value: 'earth', activates: 2,},
		{type: 'createEvent', value: 'inspireFarming', activates: 1},
	],
	hour: 0,
	day: 1,
	map: [{id: 0, name: 'island',	posX: 600, posY: 450,	animation: '', state: ''}],
	conditions: [
		{
			id: 0,
			requires: 'motes.life >= 1',
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

		// if (forest) {

		// 	if (hour % 3 === 1) {
		// 		this._updateStateObj('map', forest.id, {animation: 'hide'});
		// 	}
		// 	if (hour % 3 === 0) {
		// 		this._updateStateObj('map', forest.id, {animation: 'show', state: ''});
		// 	}
		// }

		this.state.conditions.forEach(condition => this.checkCondition(condition));

		const events = [];

		this.state.events.forEach(event => {
			if (event.ends === hour && !event.ended) {
				event = this._updateStateObj('events', event.id, {ended: true});
				this.system.massDispatch(event.onEnd);
				if (event.hasOwnProperty('chance')) {
					this.system.massDispatch(event.chance >= 100 ? event.onSuccess : event.onFail);
				}
			}
			if (!event.removed && event.ends >= hour) {
				events.push(event);
			}
		});

		const queue = this.state.queue.filter(item => {
			if (item.activates === hour) {
				switch (item.type) {
					case 'createEvent':
						events.push(this._createEvent(item.value, events));
						break;

					case 'createMapObj':
						const {type, activates, ...mapObj} = item;

						this.createMapObj(mapObj);
						break;
				}
				return false;
			}
			return true;
		});

		this.setState({events, queue});
	}

	_getSafeCoords(point, distance, events) {
		const getDistance = (c1, c2) => Math.abs(Math.sqrt(Math.pow(c1.x - c2.x, 2) + Math.pow(c1.y - c2.y, 2)));
		let unsafe;
		let tries = 0;
		let coords = {};
		let angle, radius;

		do {
			tries++;
			if (point) {
				angle = Math.random() * 2 * Math.PI;
				radius = distance * Math.sqrt(Math.random());
			}
			coords.x = point ? point.x + radius * Math.cos(angle) : Math.floor(Math.random() * 90 + 5);
			coords.y = point ? point.y + radius * Math.sin(angle) : Math.floor(Math.random() * 90 + 5);
			unsafe = events.some(event => getDistance({x: event.mapX, y: event.mapY}, coords) < 7);
		} while (unsafe && tries < 500);
		if (tries === 500) console.log('fail safe coords');
		return coords;
	}

	_createEvent(eventId, events) {
		const duration = utils.getRandom(allEvents[eventId].duration);
		const coords = this._getSafeCoords({x: 50, y: 50}, 45, events || thtis.state.events);
		const event = {...utils.deepClone(allEvents[eventId]), ...{
			mapX: coords.x,
			mapY: coords.y,
			starts: Math.floor(this.state.hour) + 1,
			ends: Math.floor(this.state.hour) + duration + 1,
			duration,
			type: eventId,
			id: eventCounter,
			ended: false,
		}};

		actionTypes.forEach(actionType => {
			const actions = event[actionType];

			actions && actions.forEach((action, index) => {
				const actionName = Object.keys(action)[0];

				if (typeof action[actionName] !== 'object' || action[actionName] instanceof Array) {
					return;
				}

				if (action[actionName].posX === 'eventPosX') {
					action[actionName].posX = event.mapX * config.mapWidth / 100;
				}
				if (action[actionName].posY === 'eventPosY') {
					action[actionName].posY = event.mapY * config.mapHeight / 100;
				}
			});
		});

		eventCounter++;
		return event;
	}

	queueItem({type, value, delay}) {
		const newItem = {type, value, activates: Math.floor(this.state.hour) + utils.getRandom(delay) + 1,};
		this.setState({queue: [...this.state.queue, newItem]});
	}

	eventAction(eventId) {
		const event = this.state.events.find(event => event.id === eventId);

		this.system.playSound('click');

		if (!event || event.ended) {
			return;
		}
		if (this.player.state.energy < event.energy) {
			return this.system.createMessage({type: 'notEnoughEnergy', name: event.name, value: event.energy});
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
		const events = this.state.events.map(event => {
			if (event.hasOwnProperty('chance') && event.chanceIncrease && event.chanceIncrease[type] && ! event.ended) {
				return {...event, chance: Math.min(event.chance + utils.getRandom(event.chanceIncrease[type]), 100)};
			} else {
				return event;
			}
		});

		this.setState({events});
	}
};

export default World;
