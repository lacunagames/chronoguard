
import React from 'react';

import World from './world';
import Player from './player';

const stateChange = (agentName, newState) => {
	subscribedFn.forEach(fnObj => {
		if (fnObj.agentNames.indexOf(agentName) > -1) {
			fnObj.fn(agentName, newState);
		}
	});
};
const subscribedFn = [];
let subscribedCounter = 0;

const agents = {
	world: new World(newState => stateChange('world', newState)),
	player: new Player(newState => stateChange('player', newState)),
};

const dispatch = (action, ...args) => {
	const agentName = Object.keys(agents).find(agentName => typeof agents[agentName][action] === 'function');

	if (!agentName) {
		return console.error(`Dispatch error: ${action} action not found.`);
	}
	return agents[agentName][action](...args);
}

Object.keys(agents).forEach(agentName => {
	const {[agentName]: thisAgent, ...otherAgents} = agents;

	Object.keys(otherAgents).forEach(otherAgentName => agents[agentName][otherAgentName] = agents[otherAgentName]);
	agents[agentName].dispatch = dispatch;
});

const connect = (Component, agentNames) => {

	class ConnectedComponent extends React.Component {

		constructor() {
			super();
			if (!agentNames) {
				agentNames = Object.keys(agents);
			}
			this.state = {};
			agentNames.forEach(agentName => this.state[agentName] = agents[agentName].getState());
			this.dispatch = dispatch;
			this.timer = {};
		}

		componentDidMount() {
			this.subscribedCounter = subscribedCounter;
			subscribedFn.push({fn: this.onChange.bind(this), counter: subscribedCounter, agentNames, });
			subscribedCounter++;
		}

		componentWillUnmount() {
			const fnObj = subscribedFn.find(fnObj => fnObj.counter === this.subscribedCounter);
			subscribedFn.splice(subscribedFn.indexOf(fnObj), 1);
			agentNames.forEach(agentName => clearTimeout(this.timer[agentName]));
		}

		onChange(agentName) {
			clearTimeout(this.timer[agentName]);
			this.timer[agentName] = setTimeout(() => this.setState({[agentName]: {...agents[agentName].state}}), 10);
		}

		render() {
			const agentProps = agentNames.reduce((obj, agentName) => obj = {...obj, [agentName]: this.state[agentName]}, {});

			return (
				<Component
					{...agentProps}
					dispatch={this.dispatch}
					{...this.props} />
			);
		}
	}

	return ConnectedComponent;
};

export default connect;
