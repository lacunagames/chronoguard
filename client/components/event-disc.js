
import './event-disc.scss';

import React from 'react';

import connect from 'game/connect';
import utils from 'utils';

class EventDisc extends React.Component {

	constructor(props) {
		super(props);
		this.eventid = this.props.event.id;
	}

	discClick(e, event) {
		e.preventDefault();
		this.props.dispatch('eventAction', event.id);
	}

	render() {
		const {world, player, event} = this.props;
		const positionStyle = {left: `${event.mapX}%`, top: `${event.mapY}%`,};
		const remaining = Math.max((event.ends - world.hour - 0.25) / event.duration * 100, 0);
		const progressStyle = {'stroke-dasharray': `${remaining * 1.3823} 138.23`};
		const start = event.starts >= world.hour && event.starts <= world.hour + 0.5;
		const end = event.ended || event.ends <= world.hour;

		if (this.eventid && event.id !== this.eventid) {
			console.log('umm: ', event, this.eventid);
			this.eventid = event.id;
		}

		if (event.starts > world.hour + 0.5) {
			return null;
		}

		return (
			<li className={utils.getClassName({
					'event-disc': true,
					'no-energy': player.energy < event.energy,
					start,
					end,
				})}
				style={positionStyle}>
				<a href="#" title={event.name}
					draggable="false"
					style={{'background-image': `url(static/images/icon-${event.name}.jpg)`}}
					onClick={e => this.discClick(e, event)}>
				</a>
				<svg width="48" height="48">
					<circle r="22" cx="24" cy="24" />
					<circle r="22" cx="24" cy="24" className="progress" ref="progress" style={progressStyle} />
				</svg>
			</li>
		);
	}
}

export default EventDisc;
