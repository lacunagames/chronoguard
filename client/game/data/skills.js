
const skills = [
	{
		id: 'scorch',
		icon: 'scorch',
		title: 'Scorch',
		desc: 'Increases fire event progress and attack power by 5.',
		skillPoints: 5,
		treeX: 5,
		treeY: 0,
	},
	{
		id: 'flameShield',
		icon: 'flame-shield',
		title: 'Flame shield',
		desc: 'Increases defense power by 10.',
		skillPoints: 10,
		treeX: 25,
		treeY: 0,
		requires: ['scorch'],
	},
	{
		id: 'fireBall',
		icon: 'fireball',
		title: 'Fireball',
		desc: 'Increases attack power by 10.',
		skillPoints: 15,
		treeX: 5,
		treeY: 30,
	},
	{
		id: 'phoenixHeart',
		icon: 'phoenix-heart',
		title: 'Phoenix Heart',
		desc: 'Increases power regeneration by 10.',
		skillPoints: 20,
		treeX: 25,
		treeY: 30,
		requires: ['fireBall'],
	},
	{
		id: 'summonDragon',
		icon: 'summon-dragon',
		title: 'Summon Dragon',
		desc: 'Increases attack power by 15.',
		skillPoints: 25,
		treeX: 5,
		treeY: 60,
	},
	{
		id: 'volcano',
		icon: 'volcano',
		title: 'Volcano',
		desc: 'Increases attack power by 20.',
		skillPoints: 30,
		treeX: 25,
		treeY: 60,
		requires: ['fireBall', 'summonDragon'],
	},
];

export default skills;
