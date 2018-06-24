
const messageTypes = {
	notEnoughEnergy: {
		duration: 10,
		message: (name, value) => `Not enough energy for ${name} action. Required: ${value}.`,
	},
};

const defaultState = {
	paused: false,
	forcePaused: false,
	messages: [],
};

let messageCounter = 0;

class System {

	constructor(subscribeState) {
		this.subscribeState = subscribeState;
		this.state = {};
		this.setState(defaultState);
	}

	getState() {
		return this.state;
	}

	setState(newState) {
		this.state = {...this.state, ...newState};
		this.subscribeState(newState);
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
		const newMessage = {
			type,
			id: messageCounter,
			message: messageTypes[type].message(name, value),
			ends: this.world.state.hour + messageTypes[type].duration,
		};

		messageCounter++;
		this.setState({messages: [...this.state.messages, ...newMessage]});
	}

	updateMessages() {
		const messages = this.state.messages.filter(message => message.ends > this.world.state.hour);

		this.setState({messages});
	}
};

export default System;
