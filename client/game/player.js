
const skills = [
	{
		title: 'Scorch',
		skillPoints: 5,
	},
	{
		title: 'Flame shield',
		skillPoints: 10,
	},
	{
		title: 'Fireball',
		skillPoints: 15,
	},
	{
		title: 'Phoenix Heart',
		skillPoints: 20,
	},
	{
		title: 'Summon Dragon',
		skillPoints: 25,
	},
	{
		title: 'Volcano',
		skillPoints: 30,
	},
];

const defaultState = {
	skillPoints: 1,
	energy: 40,
	maxEnergy: 40,
	skills: [],
};

class Player {

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

	gainSkillPoints(points) {
		this.setState({skillPoints: this.state.skillPoints + points});
	}

	changeEnergy(amount) {
		const energy = Math.min(Math.max(this.state.energy + amount, 0), this.state.maxEnergy);

		this.setState({energy});
	}
};

export default Player;
