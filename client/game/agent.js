

class Agent {

	constructor(subscribeState) {
		this.subscribeState = subscribeState;
		this.state = {};
	}

	getState() {
		return this.state;
	}

	setState(newState) {
		this.state = {...this.state, ...newState};
		this.subscribeState(newState);
	}

	_updateStateObj(arrayName, id, updates) {
		const stateArray = this.state[arrayName].map(obj => obj.id === id ? {...obj, ...updates} : obj);

		this.setState({[arrayName]: stateArray});
		return stateArray.find(obj => obj.id === id);
	}

	_removeStateObj(arrayName, id) {
		const stateArray = this.state[arrayName].filter(obj => obj.id !== id);

		this.setState({[arrayName]: stateArray});
	}
};

export default Agent;
