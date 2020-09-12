
import './event-disc.scss';

import React from 'react';

import connect from 'game/connect';
import Tooltip from './tooltip';
import utils from 'utils';
import config from 'config';
import {events as allEvents} from '../game/data/data.json';

class EventDisc extends React.Component {

	constructor(props) {
		super(props);
		utils.bindThis(this, ['toggleTooltip']);
		this.state = {tooltipOpen: false};
	}

	discClick(e, event) {
		e.preventDefault();
		event.onPop && this.props.dispatch('eventPop', event.id);
	}

	componentWillReceiveProps(nextProps) {
		if (this.state.tooltipOpen && (nextProps.event.ended || nextProps.event.ends <= nextProps.world.hour)) {
			this.setState({tooltipOpen: false});
		}
	}

	toggleTooltip(isOpen) {
		if (isOpen && (this.props.event.ended || this.props.event.ends <= this.props.world.hour)) {
			return;
		}
		this.setState({tooltipOpen: isOpen});
	}

	render() {
		const {world, player, event} = this.props;
		const isProgressEvent = event.behaviour === 'progress';
		const mapX = event.posX / config.mapWidth * 100;
		const mapY = event.posY / config.mapHeight * 100;
		const zIndex =  Math.floor(99 * (mapY * 1000 + mapX - 1) / 101000 + 1); // Downscale number to 1-100 range
		const positionStyle = {left: `${mapX}%`, top: `${mapY}%`, zIndex};
		const remaining = Math.max((event.ends - world.hour - 0.25) / event.duration * 100, 0);
		const progressStyle = isProgressEvent ? {'stroke-dashoffset': 152 - remaining / 100 * 152}
																				: {'stroke-dasharray': `${remaining * 1.3823} 138.23`};
		const start = event.starts >= world.hour && event.starts <= world.hour + 0.5;
		const end = event.starts < world.hour && (event.ended || event.ends <= world.hour);
		const endsIn = utils.humanizeNumber(event.ends - world.hour, 'turn', 'in');
		const rewards = [...(event.onSuccess ? event.onSuccess : []), ...(event.onPop ? event.onPop : [])].map(actionObj => {
			switch (Object.keys(actionObj)[0]) {
				case 'gainSkillPoints': return (
					<span className="padding-side"><span className="skill-points" />+{actionObj.gainSkillPoints}</span>
				);
				case 'changeEnergy': return (
					<span className="padding-side"><span className="energy-points" />
						{actionObj.changeEnergy > 0 ? `+${actionObj.changeEnergy}` : actionObj.changeEnergy}
					</span>
				);
				default: return '';
			}
		}).filter(str => str);

		if (event.starts > world.hour + 0.5) {
			return null;
		}

		return (
			<li className={utils.getClassName({
					'event-disc': true,
					'no-energy': player.energy < event.energy,
					'progress-event': isProgressEvent,
					'progress-done': isProgressEvent && event.progress >= 100,
					start,
					end,
				})}
				style={positionStyle}>
				<Tooltip show={this.state.tooltipOpen} toggleTooltip={this.toggleTooltip}>
					<a href="#"
						data-tooltip-trigger
						draggable="false"
						onClick={e => this.discClick(e, event)}>
						<span className="crop">
							<span className="bg" style={utils.getIconStyle(event.icon || event.title)}>
								{isProgressEvent && event.progress < 100 &&
									<span className="bg-empty" style={{
											height: `${46 - 46 * event.progress / 100}px`,
											...utils.getIconStyle(event.icon),
										}} />
								}
							</span>
						</span>
					</a>
					{this.state.tooltipOpen &&
						<div>
							<h2>
								{event.title}
								{event.energy > 0 &&
									<span className={utils.getClassName({
										'energy': true,
										'c-success': event.energy <= player.energy,
										'c-error': event.energy > player.energy,
										})}>
										<span className="energy-points" />
										{event.energy}
									</span>
								}
								<span className="ends-in small"> (Ends {endsIn})</span>
							</h2>
							{event.desc &&
								<p className="desc">{event.desc}</p>
							}
							{rewards && rewards.length > 0 &&
								<p>Rewards: {rewards}</p>
							}
							{event.progressIncrease &&
								<p>
									Progressed by:
									<span className="icon-list">
										{Object.keys(event.progressIncrease).map(eventType => {
											const matchEvent = allEvents[eventType];
											return (
												<span>
													<span style={utils.getIconStyle(matchEvent.icon || matchEvent.title)} />
													{`${matchEvent.title}: ${event.progressIncrease[eventType]}%`}
												</span>
											);
										})}
									</span>
								</p>
							}
							{isProgressEvent &&
								<p className="large">Progress: {event.progress}%</p>
							}
						</div>
					}
				</Tooltip>
				{isProgressEvent &&
					<svg width="42" height="42">
						<path className="thin" d="M4,4 38,4 38,38 4,38 4,4" />
						<path d="M2,2 40,2 40,40 2,40 2,2" />
						<path d="M4,2 40,2 40,40 2,40 2,0"  className="progress" style={progressStyle} />
					</svg>
				}
				{!isProgressEvent &&
					<svg width="48" height="48">
						<circle r="22" cx="24" cy="24" />
						<circle r="22" cx="24" cy="24" className="progress" style={progressStyle} />
					</svg>
				}
			</li>
		);
	}
}

export default EventDisc;
