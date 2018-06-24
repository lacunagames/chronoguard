
import './skills-modal.scss';

import React from 'react';

import Modal from './modal';
import utils from 'utils';

class SkillModal extends React.Component {

	constructor(props) {
		super(props);
		utils.bindThis(this, []);
		this.state = {
		};
	}

	componentDidMount() {
	}

	componentWillUnmount() {
	}

	render() {
		const {world, player, system, dispatch} = this.props;

		return (
			<Modal show={this.props.show} locked={false} onClose={this.props.onClose} size="full" {...{dispatch}}>
				<h2 data-modal-head>Skills</h2>

			</Modal>
		);
	}
}

export default SkillModal;
