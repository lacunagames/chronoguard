
import './world-screen.scss';

import React from 'react';

import connect from 'game/connect';
import EventDisc from './event-disc';

class WorldScreen extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		const {world, player} = this.props;
		const events = this.props.world.events.map((event, index) => <EventDisc index={index} />) || '';

		return (
			<div className="screen world-screen">
				<div className="time">{`Day ${world.day}, ${world.hour % 24}:00`}</div>
				<div className="skill-points" onClick={() => this.props.dispatch('gainSkillPoints', 1)}>Skill points: {player.skillPoints}</div>
				<ul className="events">{events}</ul>
			</div>
		);
	}
}

export default connect(WorldScreen);
