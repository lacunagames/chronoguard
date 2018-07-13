
const skills = [
	{
		id: 'scorch',
		icon: 'scorch',
		title: 'Scorch',
		skillPoints: 5,
		treeX: 5,
		treeY: 0,
	},
	{
		id: 'flameShield',
		icon: 'flame-shield',
		title: 'Flame shield',
		skillPoints: 10,
		treeX: 25,
		treeY: 0,
	},
	{
		id: 'fireBall',
		icon: 'fireball',
		title: 'Fireball',
		skillPoints: 15,
		treeX: 65,
		treeY: 40,
	},
	{
		id: 'phoenixHeart',
		icon: 'phoenix-heart',
		title: 'Phoenix Heart',
		skillPoints: 20,
		treeX: 45,
		treeY: 0,
		requires: ['fireBall'],
	},
	{
		id: 'summonDragon',
		icon: 'summon-dragon',
		title: 'Summon Dragon',
		skillPoints: 25,
		treeX: 65,
		treeY: 0,
	},
	{
		id: 'volcano',
		icon: 'volcano',
		title: 'Volcano',
		skillPoints: 30,
		treeX: 85,
		treeY: 0,
		requires: ['fireBall'],
	},
];

export default skills;
