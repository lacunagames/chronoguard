
const events = {
	fire: {
		title: 'Fire',
		duration: '5-6',
		energy: 5,
		posX: 'villagePosX',
		posY: 'villagePosY',
		range: 200,
		onAction: [
			{changeBoxAttr: ['fireNode', 1]},
		],
		onEnd: [
			{queueItem: {type: 'createEvent', value: 'fire', delay: '3-6'}},
		],
	},
	water: {
		title: 'Water',
		duration: '7-11',
		energy: 7,
		onAction: [
			{changeBoxAttr: ['waterNode', 1]},
			{changeMaxEnergy: 0.5},
		],
		onEnd: [
			{queueItem: {type: 'createEvent', value: 'water', delay: '8-12'}},
		]
	},
	air: {
		title: 'Air',
		duration: '5-7',
		energy: 5,
		posX: 'villagePosX',
		posY: 'villagePosY',
		range: 200,
		onAction: [
			{changeBoxAttr: ['airNode', 1]},
		],
		onEnd: [
			{queueItem: {type: 'createEvent', value: 'air', delay: '5-8'}},
		],
	},
	life: {
		title: 'Life',
		duration: '10-18',
		energy: 0,
		onAction: [
			{changeBoxAttr: ['lifeNode', 1]},
			{changeEnergy: 4},
		],
		onEnd: [
			{queueItem: {type: 'createEvent', value: 'life', delay: '7-9'}},
		]
	},
	earth: {
		title: 'Earth',
		icon: 'earth-my',
		duration: '9-11',
		energy: 10,
		onAction: [
			{changeBoxAttr: ['earthNode', 1]},
			{changeEnergyGainRate: 0.05},
		],
		onNoAction: [
			{createMapObj: {name: 'explode', posX: 'eventPosX', posY: 'eventPosY'}}
		],
		onEnd: [
			{queueItem: {type: 'createEvent', value: 'earth', delay: '15-25'}},
		]
	},
	inspireFarming: {
		title: 'Inspire farming',
		icon: 'farm',
		desc: `The village spends most of its time gathering berries and hunting nearby animals.
			Learning to grow and harvest plants would greatly increase productivity.\nWhat?`,
		duration: 20,
		chance: 75,
		posX: 'villagePosX',
		posY: 'villagePosY',
		offsetX: 50,
		offsetY: 50,
		chanceIncrease: {air: '8-10', fire: '5-8'},
		onStart: [
			{queueItem: {type: 'createEvent', value: 'air', delay: '1-3'}},
			{queueItem: {type: 'createEvent', value: 'air', delay: '3-5'}},
			{queueItem: {type: 'createEvent', value: 'fire', delay: '1-3'}},
			{queueItem: {type: 'createEvent', value: 'fire', delay: '4-6'}},
		],
		onFullChance: [
			{removeAllEventsByType: ['air', 'fire']},
		],
		onSuccess: [
			{createMapObj: {name: 'farm', posX: 'villagePosX', posY: 'villagePosY',}},
			{createMapObj:	{name: 'explode', posX: 'villagePosX', posY: 'villagePosY',}},
			{createMessage: {type: 'primary', icon: 'farm', name: 'Yay! Inspire farming completed!', descVal: 'Bla bla bla...\nBla bla bla...Bla..moo\n{icon-skill-points} +3'}},
			{gainSkillPoints: 3},
		],
		onFail: [
			{createMessage: {type: 'free', name: 'Inspire Farming Fail :('}},
		],
		onEnd: [
			{queueItem: {type: 'createEvent', value: 'inspireFarming', delay: '2-5'}},
			{removeAllEventsByType: ['air', 'fire']},
		]
	},
};

export default events;