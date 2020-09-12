
import messageTypes from './data/message-types';
import Agent from './agent';
import Sound from './sound';

const defaultState = {
	paused: false,
	forcePaused: false,
	messages: [],
	music: '',
	musicVolume: 0.15,
	soundVolume: 0.3,
};

let messageCounter = 0;

class System extends Agent {

	constructor(subscribeState) {
		super(subscribeState);
		this.setState(defaultState);

		this.sound = new Sound(() => this.playMusic('fables'), this.state.musicVolume, this.state.soundVolume);
		// setInterval(() => this.setVolume(Math.random() > 0.5 ? 'music' : 'sound', Math.random()), 2000);
		// setInterval(() => this.playMusic(this.state.music === 'fables' ? 'town' : 'fables'), 2000);
	}

	pauseGame(forced) {
		this.setState({paused: true, forcePaused: !!forced || this.state.forcePaused});
	}

	unpauseGame(forced) {
		if (!!forced === this.state.forcePaused) {
			this.setState({paused: false, forcePaused: false});
		}
	}

	createMessage({type, name, value, descVal, icon, shape}) {
		this.playSound('warning');
		const {worldTime, duration, text, desc, unique, dismissable, buttons, group,} = messageTypes[type];
		const calcDuration = duration === 0 ? false : duration || 6;
		const id = messageCounter;
		const oldMessage = !unique && this.state.messages.find(message => {
			return (message.type === type || group && message.group === group) && !message.ending;
		});
		const newMessage = {
			...messageTypes[type],
			type,
			id,
			icon,
			shape,
			dismissable: typeof dismissable === 'undefined' || dismissable,
			text: typeof text === 'function' ? text(name, value) : text,
			desc: typeof desc === 'function' ? desc(descVal) : desc || '',
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
		setTimeout(() => this._removeStateObj('messages', id), 500);
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

	massDispatch(actionArr, actionType) {
		const actions = actionType ? actionArr[actionType] : actionArr;
		const eventType = actionType ? actionArr.type : undefined;

		actions && actions.forEach(action => {
			const actionName = Object.keys(action)[0];
			const args = action[actionName] instanceof Array ? action[actionName] : [action[actionName]];

			this.dispatch(actionName, ...args);
		});
		if (eventType && actionType) {
			this.world.state.conditions.forEach(condition => this.world.checkCondition(condition, eventType, actionType));
		}
	}

	playMusic(musicName) {
		this.setState({music: musicName});
		this.sound.playMusic(musicName, this.state.musicVolume);
	}

	playSound(soundName) {
		this.sound.playSound(soundName, this.state.soundVolume);
	}

	setVolume(type, volume) {
		console.log(volume, type);
		this.sound.setVolume(type, volume);
		this.setState({[`${type}Volume`]: volume});
	}
};

export default System;
