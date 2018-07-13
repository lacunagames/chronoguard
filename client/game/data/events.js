
const events = {
	fire: {
		name: 'Fire',
		duration: '5-7',
		energy: 5,
		onAction: {
			gainMote: ['fire', 1],
			gainSkillPoints: 1,
		},
		onEnd: {
			queueItem: {type: 'createEvent', id: 'fire', delay: '6-10'},
		},
	},
	water: {
		name: 'Water',
		duration: '7-11',
		energy: 7,
		onAction: {
			gainMote: ['water', 1],
			changeMaxEnergy: 0.5,
		},
		onEnd: {
			queueItem: {type: 'createEvent', id: 'water', delay: '8-12'},
		}
	},
	air: {
		name: 'Air',
		duration: '5-7',
		energy: 5,
		onAction: {
			gainMote: ['air', 1],
			gainSkillPoints: 1,
		},
		onEnd: {
			queueItem: {type: 'createEvent', id: 'air', delay: '5-8'},
		},
	},
	life: {
		name: 'Life',
		duration: '10-18',
		energy: 0,
		onAction: {
			gainMote: ['life', 1],
			changeEnergy: 4,
		},
		onEnd: {
			queueItem: {type: 'createEvent', id: 'life', delay: '7-9'},
			checkCondition: {
				requires: 'motes.life >= 1',
				actions: {
					createMapObj: {name: 'forest2', posX: 680, posY: 428,},
					createMessage: {type: 'free', name: 'Double forest!'},
					removeCondition: 'life',
				}
			},
		}
	},
	earth: {
		name: 'earth-my',
		duration: '9-11',
		energy: 10,
		onAction: {
			gainMote: ['earth', 1],
			changeEnergyGainRate: 0.05,
		},
		onEnd: {
			queueItem: {type: 'createEvent', id: 'earth', delay: '15-25'},
		}
	},
};

export default events;