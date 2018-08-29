
import React from 'react';

import utils from 'utils';

class Screen extends React.Component {

	constructor(props) {
		super(props);
		utils.bindThis(this, ['screenKeydown', 'screenMousedown']);
		this.state = {tabKey: false};
		document.title = this.props.pageTitle || document.title;
	}

	componentDidMount() {
		utils.onEvent(window, 'keydown', this.screenKeydown);
		utils.onEvent(window, 'mousedown touchstart', this.screenMousedown);
	}

	componentWillUnmount() {
		utils.offEvent(window, 'keydown', this.screenKeydown);
		utils.offEvent(window, 'mousedown touchstart', this.screenMousedown);
	}

	screenKeydown(e) {
		if (e.keyCode === 9) {
			this.setState({tabKey: true});
		}
	}

	screenMousedown() {
		this.setState({tabKey: false});
	};

	render() {
		return (
			<div className={utils.getClassName({
					'tab-active': this.state.tabKey,
					screen: true,
				})}>
				<div className={this.props.className}>
					{this.props.children}
				</div>
				<div class="tooltip-container" />
				<div class="modal-container" />
			</div>
		);
	}
}

export default Screen;
