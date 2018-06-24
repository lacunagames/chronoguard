
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
	energy: 10,
	maxEnergy: 15,
	energyGainRate: 1,
	motes: {
		fire: 0,
		earth: 0,
		air: 0,
		water: 0,
		life: 0,
		shadow: 0,
		light: 0,
	},
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

	gainMote(type, amount) {
		this.setState({motes: {...this.state.motes, [type]: this.state.motes[type] + amount}});
	}

	gainSkillPoints(amount) {
		this.setState({skillPoints: this.state.skillPoints + amount});
	}

	changeEnergy(amount) {
		const energy = Math.min(Math.max(this.state.energy + amount, 0), this.state.maxEnergy);

		this.setState({energy});
	}

	changeMaxEnergy(amount) {
		this.setState({maxEnergy: this.state.maxEnergy + amount});
	}

	changeEnergyGainRate(amount) {
		this.setState({energyGainRate: this.state.energyGainRate + amount});
	}
};

export default Player;
