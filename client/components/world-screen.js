
import './world-screen.scss';

import React from 'react';

import connect from 'game/connect';
import EventDisc from './event-disc';
import Modal from './modal';
import SkillModal from './skill-modal';
import utils from 'utils';

class WorldScreen extends React.Component {

	constructor(props) {
		super(props);
		utils.bindThis(this, ['toggleVisiblePause', 'togglePause', 'toggleSkillModal']);
		this.throttlePause = utils.throttle(this.togglePause, 210);
		this.throttleSkillModal = utils.throttle(this.toggleSkillModal, 210);
		this.state = {
			pauseModalOpen: false,
			skillModalOpen: false,
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
		if (e.type === 'keydown' && e.keyCode !== 32 || this.state.skillModalOpen) {
			return;
		}
		this.setState({pauseModalOpen: !this.state.pauseModalOpen});
	}

	toggleSkillModal() {
		this.setState({skillModalOpen: !this.state.skillModalOpen});
	}

	render() {
		const {world, player, system, dispatch} = this.props;
		const events = world.events.map((event, index) => <EventDisc key={event.id} {...{event, world, player, dispatch}} />) || '';

		return (
			<div className="screen world-screen">
				<div className="time">{`Day ${world.day}, ${Math.floor(world.hour) % 24}:00`}</div>
				<div className="skill-points">
					Skill points: {player.skillPoints}<br />
					Energy: {Math.floor(player.energy)}<br />
					Fire: {player.motes.fire}<br />
					Water: {player.motes.water}<br />
					Air: {player.motes.air}<br />
					Earth: {player.motes.earth}<br />
					Light: {player.motes.light}<br />
					Shadow: {player.motes.shadow}<br />
					Life: {player.motes.life}<br />
					<button onClick={this.throttleSkillModal}>Skills</button>
				</div>
				<ul className="events">{events}</ul>
				<Modal show={this.state.pauseModalOpen} locked={false} onClose={this.throttlePause} {...{dispatch}}>
					<h2 data-modal-head>Game has been paused.</h2>
				</Modal>
				<SkillModal show={this.state.skillModalOpen} onClose={this.throttleSkillModal} {...this.props} />
			</div>
		);
	}
}

export default connect(WorldScreen);
