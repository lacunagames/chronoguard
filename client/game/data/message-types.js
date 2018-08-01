
// text: static text or generate text fn (fn - name/value/etc.),
// worldTime: ends on world.hour, default: false
// dismissable: end message on click, default: true
// unique: multiple messages are allowed, default: false
// duration: ends in seconds, default: 6, permanent: 0

const messageTypes = {
	notEnoughEnergy: {
		text: (name, value) => `Not enough energy for ${name}. Requires {icon-energy-points} ${value}.`,
		worldTime: true,
	},
	notEnoughSkillPoints: {
		text: (name, value) => `Not enough skill points for ${name}. Requires {icon-skill-points} ${value}.`,
		dismissable: false,
		group: 'skill',
	},
	requiresSkill: {
		text: (name, value) => `${name} requires the ${value} skill.`,
		group: 'skill',
	},
	skillAlreadyLearnt: {
		text: name => `${name} is already learnt.`,
		group: 'skill',
	},
	testEventAction: {
		text: (name) => `${name} action completed!`,
		duration: 0,
		unique: true,
		dismissable: false,
		buttons: [
			{
				title: 'Duplicate',
				onAction: {queueItem: {type: 'createEvent', id: 'water', delay: '2-3'}},
				primary: true,
			},
			{
				title: 'Cancel',
			}
		],
	},
	free: {
		text: name => `${name}`,
		desc: descVal => `${descVal || ''}`,
	},
	primary: {
		text: name => `${name}`,
		desc: descVal => `${descVal || ''}`,
		duration: 12,
	}
};

export default messageTypes;