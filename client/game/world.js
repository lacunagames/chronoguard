
import utils from 'utils';
import events from './data/events';
import Agent from './agent';

const defaultState = {
	events: [],
	queue: [
		{type: 'createEvent', id: 'fire', activates: 1,},
		{type: 'createEvent', id: 'water', activates: 3,},
		{type: 'createEvent', id: 'air', activates: 4,},
		{type: 'createEvent', id: 'life', activates: 8,},
		{type: 'createEvent', id: 'earth', activates: 11,},
		{type: 'createEvent', id: 'fire', activates: 3,},
		{type: 'createEvent', id: 'water', activates: 2,},
		{type: 'createEvent', id: 'air', activates: 6,},
		{type: 'createEvent', id: 'life', activates: 7,},
		{type: 'createEvent', id: 'earth', activates: 2,},
	],
	hour: 0,
	day: 1,
	map: [{id: 0, name: 'island',	posX: 600, posY: 450,	animation: '', state: ''}],
	conditions: [
		{
			id: 0,
			requires: 'motes.life >= 2',
			actions: {
				createMapObj: {name: 'forest', posX: 685, posY: 440,},
				createMessage: {type: 'free', name: 'A forest evolved from high natural activity.'},
				removeCondition: 0,
			},
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

		this.state.conditions.forEach(condition => this.checkCondition(condition));

		const events = [];

		this.state.events.forEach(event => {
			if (event.ends === hour && !event.ended) {
				event = this._updateStateObj('events', event.id, {ended: true});
				this.system.massDispatch(event.onEnd);
			}
			if (!event.removed && event.ends >= hour) {
				events.push(event);
			}
		});

		const queue = this.state.queue.filter(item => {
			if (item.activates === hour) {
				if (item.type === 'createEvent') {
					events.push(this._createEvent(item.id));
				}
				return false;
			}
			return true;
		});

		this.setState({events, queue});
	}

	_createEvent(eventId) {
		const duration = utils.getRandom(events[eventId].duration);
		const event = {...events[eventId], ...{
			mapX: Math.floor(Math.random() * 80 + 10),
			mapY: Math.floor(Math.random() * 80 + 10),
			starts: Math.floor(this.state.hour) + 1,
			ends: Math.floor(this.state.hour) + duration + 1,
			duration,
			id: eventCounter,
			ended: false,
		}};

		eventCounter++;
		return event;
	}

	queueItem({type, id, delay}) {
		const newItem = {id, activates: Math.floor(this.state.hour) + utils.getRandom(delay) + 1, type};
		this.setState({queue: [...this.state.queue, newItem]});
	}

	eventAction(eventId) {
		const event = this.state.events.find(event => event.id === eventId);

		if (!event || event.ended) {
			return;
		}
		if (this.player.state.energy < event.energy) {
			return this.system.createMessage({type: 'notEnoughEnergy', name: event.name, value: event.energy});
		}
		if (this.isClicking) {
			return console.log(eventId + ' clicked');
		}
		this.isClicking = true;
		setTimeout(() => this.isClicking = false, 200);

		this.player.changeEnergy(-event.energy);
		this._updateStateObj('events', event.id, {ended: true});
		setTimeout(() => this._updateStateObj('events', event.id, {removed: true}), 1000);
		this.system.massDispatch(event.onAction);
		this.system.massDispatch(event.onEnd);
	}

	createMapObj(mapObj) {
		const newObj = {id: mapCounter, animation: 'create', state: '', ...mapObj};

		mapCounter++;
		this.setState({map: [...this.state.map, newObj]});
	}

	removeCondition(id) {
		if (typeof id === 'number') {
			this._removeStateObj('conditions', id);
		} else if (events[id]) {
			delete events[id].onEnd.checkCondition;
			delete events[id].onAction.checkCondition;
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
						return console.warn(`Error: condition '${condition.requires}' is not a valid condition.`);
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

	animationEnded(id) {
		const mapObj = this.state.map.find(obj => obj.id === id);

		// Remove mapObj after fadeOut
		if (mapObj.animation === 'destroy') {
			const map = this.state.map.filter(mapObj => mapObj.id !== id);

			this.setState({map});
		} else {
			this._updateStateObj('map', id, {animation: '', state: mapObj.animation === 'hide' ? 'hidden' : ''});
		}
	}
};

export default World;
