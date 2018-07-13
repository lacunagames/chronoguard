
import './world-screen.scss';

import React from 'react';

import connect from 'game/connect';
import Screen from './screen';
import EventDisc from './event-disc';
import Modal from './modal';
import SkillModal from './skill-modal';
import Messages from './messages';
import MapCanvas from './map-canvas';
import utils from 'utils';

class WorldScreen extends React.Component {

	constructor(props) {
		super(props);
		utils.bindThis(this, ['toggleVisiblePause', 'togglePause', 'toggleSkillModal', 'updateEventsPosition']);
		this.throttlePause = utils.throttle(this.togglePause, 210);
		this.throttleSkillModal = utils.throttle(this.toggleSkillModal, 210);
		this.state = {
			pauseModalOpen: false,
			skillModalOpen: false,
			offsetX: 0,
			offsetY: 0,
			mapWidth: '100%',
			mapHeight: '75%',
		};
	}

	componentDidMount() {
		utils.onEvent(window, 'keydown', this.throttlePause);
		utils.onEvent(document, 'visibilitychange', this.toggleVisiblePause);
	}

	componentWillUnmount() {
		utils.offEvent(window, 'keydown', this.throttlePause);
		utils.offEvent(document, 'visibilitychange', this.toggleVisiblePause);
		this.throttleToggle.clear();
	}

	toggleVisiblePause() {
		this.props.dispatch(document.hidden ? 'pauseGame' : 'unpauseGame');
	}

	togglePause(e) {
		if ((e.type === 'keydown' && e.keyCode !== 32) || this.state.skillModalOpen) {
			return;
		}
		e.preventDefault();
		this.setState({pauseModalOpen: !this.state.pauseModalOpen});
	}

	toggleSkillModal() {
		this.setState({skillModalOpen: !this.state.skillModalOpen});
	}

	updateEventsPosition(offsetX, offsetY, mapWidth, mapHeight) {
		this.setState({offsetX, offsetY, mapWidth, mapHeight});
	}

	render() {
		const {world, player, system, dispatch} = this.props;
		const events = world.events.map((event, index) => <EventDisc key={event.id} {...{event, world, player, dispatch}} />) || '';

		return (
			<Screen className="world-screen">
				<MapCanvas map={world.map} updateEventsPosition={this.updateEventsPosition} dispatch={dispatch} />
				<div className="time">{`Day ${world.day}, ${Math.floor(world.hour) % 24}:00`}</div>
				<div className="skill-points">
					Skill points: {player.skillPoints}<br />
					Energy: {Math.floor(player.energy)}<br />
					{/*Fire: {player.motes.fire}<br />
					Water: {player.motes.water}<br />
					Air: {player.motes.air}<br />
					Earth: {player.motes.earth}<br />
					Light: {player.motes.light}<br />
					Shadow: {player.motes.shadow}<br />
					Life: {player.motes.life}<br />*/}<br />
					<button onClick={this.throttleSkillModal}>Skills</button>
				</div>
				<ul className="events" style={{
					left: this.state.offsetX + 'px',
					top: this.state.offsetY + 'px',
					width: this.state.mapWidth + 'px',
					height: this.state.mapHeight + 'px',
				}}>
					{events}
				</ul>
				<Messages messages={system.messages} dispatch={dispatch} />
				<Modal show={this.state.pauseModalOpen} locked={false} onClose={this.throttlePause} dispatch={dispatch}>
					<h2 data-modal-head>Game has been paused.</h2>
				</Modal>
				<SkillModal show={this.state.skillModalOpen} onClose={this.throttleSkillModal} {...this.props} />
			</Screen>
		);
	}
}

export default connect(WorldScreen);
