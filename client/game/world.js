
import utils from 'utils';
import events from './events';

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
};

let eventCounter = 0;

class World {

	constructor(subscribeState) {
		utils.bindThis(this, ['_worldChange', 'eventAction']);
		this.subscribeState = subscribeState;
		this.state = {};
		this.setState(defaultState);
		defaultState.events.push(this._createEvent('life'));
		this.changeInterval = setInterval(this._worldChange, 250);
	}

	getState() {
		return this.state;
	}

	setState(newState) {
		this.state = {...this.state, ...newState};
		this.subscribeState(newState);
	}

	_worldChange() {
		if (this.system.state.paused) {
			return false;
		}
		const hour = this.state.hour + 0.25;
		const day = hour % 24 === 0 ? this.state.day + 1 : this.state.day;

		this.setState({hour, day});
		this.system.updateMessages();
		this.player.changeEnergy(0.25 * this.player.state.energyGainRate);

		if (hour % 1 !== 0) {
			return;
		}

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

	_massDispatch(actionObj) {
		Object.keys(actionObj).forEach(actionName => {
			const args = actionObj[actionName] instanceof Array ? actionObj[actionName] : [actionObj[actionName]];

			this.dispatch(actionName, ...args);
		});
	}

	_updateEvent(eventId, updates) {
		const events = this.state.events.map(event => event.id === eventId ? {...event, ...updates} : event);

		this.setState({events});
	}

	queueItem({type, id, delay}) {
		const newItem = {id, activates: Math.floor(this.state.hour) + utils.getRandom(delay) + 1, type};

		this.setState({queue: [...this.state.queue, newItem]});
	}

	eventAction(event) {
		if (event.ended) {
			return;
		}
		if (this.player.state.energy < event.energy) {
			return this.system.createMessage({type: 'notEnoughEnergy', name: event.name, value: event.energy});
		}
		this.player.changeEnergy(-event.energy);
		this._updateEvent(event.id, {ended: true});
		setTimeout(() => this._updateEvent(event.id, {removed: true}), 1000);
		this._massDispatch(event.onAction);
		this._massDispatch(event.onEnd);
	}
};

export default World;
