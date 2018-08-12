
import Agent from '../game/agent';
import utils from 'utils';

class Editor extends Agent {

	constructor(subscribeState) {
		super(subscribeState);
		utils.bindThis(this, ['_saveEvent']);

		this.state = {};
		this.subscribeSave = {};
		this.saving = false;
		this.saveQueue = {};
		this.debounceSave = utils.debounce(this._saveEvent, 1000);

		this._loadData();
	}

	_request({url, type, data}) {
		return new Promise((resolve, reject) => {
			const request = new XMLHttpRequest();

			request.onreadystatechange = () => {
				if (request.readyState === XMLHttpRequest.DONE && request.status === 200) {
					const data = JSON.parse(request.response);
					resolve(data);
				}
			};

			request.open(type ? type.toUpperCase() : 'GET', url);
			request.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
			request.send(data && JSON.stringify(data));
		});
	}

	saveEvent(type, eventObj) {
		return new Promise((resolve, reject) => {
			this.subscribeSave[type] = this.subscribeSave[type] || [];
			this.subscribeSave[type].push(event => resolve(event));
			if (this.saving && this.saving !== type) {
				this.saveQueue[type] = eventObj;
			} else {
				this.saving = type;
				this.debounceSave(type, eventObj);
			}
		});
	}

	_saveEvent(type, eventObj) {
		const sendEvent = {...eventObj};

		if (sendEvent.behaviour === 'chance') {
			delete sendEvent.energy;
			sendEvent.chance = sendEvent.chance ? +sendEvent.chance : 0;
		} else {
			delete sendEvent.chance;
			sendEvent.energy = sendEvent.energy ? sendEvent.energy : 0;
		}
		delete sendEvent.behaviour;

		this.saving = '!inProgress';
		this._request({url: '/save-event', type: 'post', data: {[type]: sendEvent}}).then(eventObj => {
			const nextSave = Object.keys(this.saveQueue)[0];

			if (!this.saveQueue[type]) {
				this.subscribeSave[type].forEach(fn => fn(eventObj));
				this.subscribeSave[type] = [];
			}
			if (nextSave) {
				this.saving = nextSave;
				this.debounceSave(nextSave, this.saveQueue[nextSave]);
				delete this.saveQueue[nextSave];
			} else {
				this.saving = false;
			}
		});
	}

	_loadData() {
		this._request({url: '/get-data'}).then(data => {
			Object.keys(data.events).forEach(eventName => {
				const event = data.events[eventName];

				data.events[eventName] = {
					...event,
					behaviour: typeof event.chance === 'undefined' ? 'pop' : 'chance',
					icon: event.icon || data.icons.find(icon => icon === event.title.toLowerCase().replace(/ /g, '-')) || 'default',
					chance: ['number', 'string'].includes(typeof event.chance) ? event.chance + '' : '',
				};
			});
			this.setState({
				...data,
			});
		});
	}
}

export default Editor;
