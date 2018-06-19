
const events = {
	bonfire: {
		name: 'Bonfire',
		desc: 'Bonfire description',
		duration: 6,
		type: 'fire',
		onAction: {
			gainSkillPoints: 1,
		},
		onEnd: {
			queueItem: {type: 'createEvent', id: 'bonfire', delay: 3},
		},
	},
	incantate: {
		name: 'Incantate',
		desc: 'Bla bla',
		duration: 5,
		type: 'fire',
		onEnd: {
			queueItem: {type: 'createEvent', id: 'incantate', delay: 2},
			gainSkillPoints: 1,
		}
	}
};

const defaultState = {
	events: [],
	queue: [{type: 'createEvent', id: 'bonfire', activates: 3,},{type: 'createEvent', id: 'incantate', activates: 1,}],
	hour: 0,
	day: 1,
};

class World {

	constructor(subscribeState) {
		this.subscribeState = subscribeState;
		this.state = {};
		this.setState(defaultState);
		this.changeInterval = setInterval(this._worldChange.bind(this), 1000);
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

		const events = [];

		this.state.events.forEach(event => {
			if (event.ends <= hour) {
				Object.keys(event.onEnd).forEach(actionName => {
					const args = event.onEnd[actionName] instanceof Array ? event.onEnd[actionName] : [event.onEnd[actionName]];

					this.dispatch(actionName, ...args);
				});
			} else {
				events.push(event);
			}
		});

		const queue = this.state.queue.filter(item => {
			if (item.activates <= hour) {
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
			ends: this.state.hour + events[eventId].duration,
			id: eventId,
		}};

		return event;
	}

	queueItem({type, id, delay}) {
		const newItem = {id, activates: this.state.hour + delay, type};
		this.setState({queue: [...this.state.queue, newItem]});
	}
};

export default World;
