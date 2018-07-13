
import skills from './data/skills';

const defaultState = {
	skillPoints: 50,
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
	skills,
	learntSkills: [],
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

	learnSkill(skillId) {
		const skill = this.state.skills.find(skill => skill.id === skillId);

		if (this.state.learntSkills.indexOf(skill.id) > -1) {
			return  this.system.createMessage({type: 'skillAlreadyLearnt', name: skill.title});
		}
		if (skill.requires && skill.requires.some(id => this.state.learntSkills.indexOf(id) === -1)) {
			const required = this.state.skills.find(skillSearch => {
				return skill.requires.indexOf(skillSearch.id) > -1 && this.state.learntSkills.indexOf(skillSearch.id) === -1;
			});
			return this.system.createMessage({type: 'requiresSkill', name: skill.title, value: required.title});
		}
		if (this.state.skillPoints < skill.skillPoints) {
			return this.system.createMessage({type: 'notEnoughSkillPoints', name: skill.title, value: skill.skillPoints});
		}
		this.setState({
			learntSkills: [...this.state.learntSkills, skill.id],
			skillPoints: this.state.skillPoints - skill.skillPoints,
		});
	}
};

export default Player;
