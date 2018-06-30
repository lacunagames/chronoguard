
const skills = [
	{
		id: 'scorch',
		icon: 'scorch',
		title: 'Scorch',
		skillPoints: 5,
		treeX: 0,
		treeY: 30,
	},
	{
		id: 'flameShield',
		icon: 'flame-shield',
		title: 'Flame shield',
		skillPoints: 10,
		treeX: 15,
		treeY: 10,
		requires: ['scorch'],
	},
	{
		id: 'fireBall',
		icon: 'fireball',
		title: 'Fireball',
		skillPoints: 15,
		treeX: 30,
		treeY: 70,
		requires: ['flameShield'],
	},
	{
		id: 'phoenixHeart',
		icon: 'phoenix-heart',
		title: 'Phoenix Heart',
		skillPoints: 20,
		treeX: 5,
		treeY: 80,
		requires: ['fireBall'],
	},
	{
		id: 'summonDragon',
		icon: 'summon-dragon',
		title: 'Summon Dragon',
		skillPoints: 25,
		treeX: 15,
		treeY: 50,
		requires: ['phoenixHeart'],
	},
	{
		id: 'volcano',
		icon: 'volcano',
		title: 'Volcano',
		skillPoints: 30,
		treeX: 85,
		treeY: 10,
		requires: ['summonDragon', 'fireBall'],
	},
];

export default skills;
