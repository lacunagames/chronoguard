
import Agent from './agent';
import skills from './data/skills';

const defaultState = {
	skillPoints: 5,
	energy: 5,
	maxEnergy: 10,
	energyGainRate: 0.5,
	box: {},
	skills,
	learntSkills: [],
};


class Player extends Agent {

	constructor(subscribeState) {
		super(subscribeState);
		this.subscribeState = subscribeState;
		this.state = {};
		this.setState(defaultState);
	}

	setBoxAttr(type, value) {
		this.setState({box: {...this.state.box, [type]: value}});
	}

	changeBoxAttr(type, amount) {
		const value = (this.state.box[type] || 0) + amount;

		this.setState({box: {...this.state.box, [type]: value}});
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

export {
	defaultState,
};

export default Player;
