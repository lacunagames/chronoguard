
import './event-disc.scss';

import React from 'react';

import connect from 'game/connect';

class EventDisc extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		const {world, player, index} = this.props;
		const event = world.events[index];
		const positionStyle = {left: `${event.mapX}%`, top: `${event.mapY}%`};

		return (
			<li className="event-disc" style={positionStyle}>
				<a href="#" title={event.name}></a>
			</li>
		);
	}
}

export default connect(EventDisc);
