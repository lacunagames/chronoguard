
import messageTypes from './data/message-types';
import Agent from './agent';

const defaultState = {
	paused: false,
	forcePaused: false,
	messages: [],
};

let messageCounter = 0;

class System extends Agent {

	constructor(subscribeState) {
		super(subscribeState);
		this.setState(defaultState);
	}

	pauseGame(forced) {
		this.setState({paused: true, forcePaused: !!forced || this.state.forcePaused});
	}

	unpauseGame(forced) {
		if (!!forced === this.state.forcePaused) {
			this.setState({paused: false, forcePaused: false});
		}
	}

	createMessage({type, name, value}) {
		const {worldTime, duration, text, unique, dismissable, buttons, group} = messageTypes[type];
		const calcDuration = duration === 0 ? false : duration || 6;
		const id = messageCounter;
		const oldMessage = !unique && this.state.messages.find(message => {
			return (message.type === type || group && message.group === group) && !message.ending;
		});
		const newMessage = {
			...messageTypes[type],
			type,
			id,
			dismissable: typeof dismissable === 'undefined' || dismissable,
			text: typeof text === 'function' ? text(name, value) : text,
			ends: worldTime && calcDuration && this.world.state.hour + calcDuration,
			timer: !worldTime && calcDuration && setTimeout(() => this.endMessage(id), calcDuration * 1000),
			starting: true,
		};

		if (oldMessage && !oldMessage.ending) {
			clearTimeout(oldMessage.timer);
			this.endMessage(oldMessage.id);
		}
		messageCounter++;
		setTimeout(() => this._updateStateObj('messages', newMessage.id, {starting: false}), 50);

		this.setState({messages: [...this.state.messages, newMessage]});
	}

	endMessage(id) {
		const message = this.state.messages.find(message => message.id === id);

		if (!message || message.ending) {
			return;
		}
		this._updateStateObj('messages', id, {ending: true});
		setTimeout(() => this.setState({messages: this.state.messages.filter(message => message.id !== id)}), 500);
	}

	updateWorldMessages() {
		this.state.messages.forEach(message => {
			if (message.ends && message.ends <= this.world.state.hour) {
				this.endMessage(message.id);
			}
		});
	}

	setAgentValue(agentName, attribute, newValue) {
		const agent = agentName === 'system' ? this : this[agentName];

		if (typeof agent.state[attribute] === 'undefined') {
			return console.warn(`Error: ${attribute} not found in ${agentName} state.`);
		}
		agent.setState({[attribute]: newValue});
	}

	massDispatch(actionObj) {
		Object.keys(actionObj).forEach(actionName => {
			const args = actionObj[actionName] instanceof Array ? actionObj[actionName] : [actionObj[actionName]];

			this.dispatch(actionName, ...args);
		});
	}
};

export default System;
