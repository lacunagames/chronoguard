
const events = {
	fire: {
		name: 'Fire',
		duration: '1-2',
		energy: 5,
		posX: 'villagePosX',
		posY: 'villagePosY',
		range: 200,
		onAction: [
			{gainMote: ['fire', 1]},
		],
		onEnd: [
			{queueItem: {type: 'createEvent', value: 'fire', delay: '3-6'}},
		],
	},
	water: {
		name: 'Water',
		duration: '7-11',
		energy: 7,
		onAction: [
			{gainMote: ['water', 1]},
			{changeMaxEnergy: 0.5},
		],
		onEnd: [
			{queueItem: {type: 'createEvent', value: 'water', delay: '8-12'}},
		]
	},
	air: {
		name: 'Air',
		duration: '5-7',
		energy: 5,
		onAction: [
			{gainMote: ['air', 1]},
		],
		onEnd: [
			{queueItem: {type: 'createEvent', value: 'air', delay: '5-8'}},
		],
	},
	life: {
		name: 'Life',
		duration: '10-18',
		energy: 0,
		onAction: [
			{gainMote: ['life', 1]},
			{changeEnergy: 4},
		],
		onEnd: [
			{queueItem: {type: 'createEvent', value: 'life', delay: '7-9'}},
			{checkCondition: {
				requires: 'motes.life >= 2',
				actions: [
					{createMapObj: {name: 'forest2', posX: 680, posY: 428,}},
					{createMessage: {type: 'free', name: 'Double forest!'}},
					{removeCondition: 'life'},
				],
			}},
		]
	},
	earth: {
		name: 'earth-my',
		duration: '9-11',
		energy: 10,
		onAction: [
			{gainMote: ['earth', 1]},
			{changeEnergyGainRate: 0.05},
		],
		onEnd: [
			{queueItem: {type: 'createEvent', value: 'earth', delay: '15-25'}},
		]
	},
	inspireFarming: {
		name: 'inspire-farming',
		icon: 'farm',
		title: 'Inspire farming',
		desc: `The village spends most of its time gathering berries and hunting nearby animals.
			Learning to grow and harvest plants would greatly increase productivity.`,
		duration: 50,
		chance: 15,
		chanceIncrease: {air: '8-10', fire: '5-8'},
		onSuccess: [
			{createMapObj: {name: 'farm', posX: 'villagePosX', posY: 'villagePosY',}},
			{createMapObj:	{name: 'explode', posX: 'villagePosX', posY: 'villagePosY',}},
			{createMessage: {type: 'primary', icon: 'farm', name: 'Yay! Inspire farming completed!', descVal: 'Bla bla bla...Bla bla bla...Bla.. {icon-skill-points} +3'}},
			{gainSkillPoints: 3},
		],
		onFail: [
			{createMessage: {type: 'free', name: 'Inspire Farming Fail :('}},
		],
		onEnd: [
			{queueItem: {type: 'createEvent', value: 'inspireFarming', delay: '12-15'}},
		]
	},
};

export default events;