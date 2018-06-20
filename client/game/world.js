
import utils from 'utils';

const events = {
	bonfire: {
		name: 'Bonfire',
		duration: 30,
		energy: 5,
		onAction: {
			gainSkillPoints: 1,
		},
		onEnd: {
			queueItem: {type: 'createEvent', id: 'bonfire', delay: 3},
		},
	},
	incantate: {
		name: 'Incantate',
		duration: 9,
		energy: 10,
		onAction: {
			gainSkillPoints: 2,
		},
		onEnd: {
			queueItem: {type: 'createEvent', id: 'incantate', delay: 1},
		}
	},
	energy: {
		name: 'Energy',
		duration: 5,
		energy: 0,
		onAction: {
			changeEnergy: 3,
		},
		onEnd: {
			queueItem: {type: 'createEvent', id: 'energy', delay: 3},
		}
	},
	nature: {
		name: 'Nature',
		duration: 14,
		energy: 15,
		onAction: {
			gainSkillPoints: 3,
		},
		onEnd: {
			queueItem: {type: 'createEvent', id: 'nature', delay: 6},
		}
	},
	earth: {
		name: 'Earth',
		duration: 9,
		energy: 12,
		onAction: {
			gainSkillPoints: 2,
		},
		onEnd: {
			queueItem: {type: 'createEvent', id: 'earth', delay: 11},
		}
	},
};

const defaultState = {
	events: [],
	queue: [
		{type: 'createEvent', id: 'incantate', activates: 1,},
		{type: 'createEvent', id: 'energy', activates: 3,},
		{type: 'createEvent', id: 'energy', activates: 4,},
		{type: 'createEvent', id: 'nature', activates: 8,},
		{type: 'createEvent', id: 'earth', activates: 11,},
	],
	hour: 0,
	day: 1,
};

let eventCounter = 0;

class World {

	constructor(subscribeState) {
		utils.bindThis(this, ['_worldChange', 'eventAction']);
		this.subscribeState = subscribeState;
		this.state = {};
		this.setState(defaultState);
		defaultState.events.push(this._createEvent('bonfire'));
		this.changeInterval = setInterval(this._worldChange, 1000);
	}

	getState() {
		return this.state;
	}

	setState(newState) {
		this.state = {...this.state, ...newState};
		this.subscribeState(newState);
	}

	_worldChange() {
		const hour = this.state.hour + 1;
		const day = hour % 24 === 0 ? this.state.day + 1 : this.state.day;

		this.setState({hour, day});
		this.player.changeEnergy(1);

		const events = [];

		this.state.events.forEach(event => {
			if (event.ends === hour && !event.ended) {
				this._massDispatch(event.onEnd);
				this._updateEvent(event.id, {ended: true});
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
		const event = {...events[eventId], ...{
			mapX: Math.floor(Math.random() * 80 + 10),
			mapY: Math.floor(Math.random() * 80 + 10),
			starts: this.state.hour + 1,
			ends: this.state.hour + events[eventId].duration + 1,
			id: eventCounter,
			ended: false,
		}};

		eventCounter++;
		return event;
	}

	_massDispatch(obj) {
		Object.keys(obj).forEach(actionName => {
			const args = obj[actionName] instanceof Array ? obj[actionName] : [obj[actionName]];

			this.dispatch(actionName, ...args);
		});
	}

	_updateEvent(eventId, updates) {
		const events = this.state.events.map(event => event.id === eventId ? {...event, ...updates} : event);

		this.setState({events});
	}

	queueItem({type, id, delay}) {
		const newItem = {id, activates: this.state.hour + delay + 1, type};

		this.setState({queue: [...this.state.queue, newItem]});
	}

	eventAction(event) {
		if (this.player.state.energy < event.energy) {
			return console.warn(`Not enough energy for ${event.name}`);
		}
		this.player.changeEnergy(-event.energy);
		this._updateEvent(event.id, {ended: true});
		setTimeout(() => this._updateEvent(event.id, {removed: true}), 1000);
		this._massDispatch(event.onAction);
		this._massDispatch(event.onEnd);
	}
};

export default World;
