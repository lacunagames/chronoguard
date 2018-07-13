
import './messages.scss';

import React from 'react';

import utils from 'utils';

class Messages extends React.Component {

	constructor(props) {
		super(props);
		utils.bindThis(this, ['updatePosition', 'dismissMessage', 'buttonClick']);
		this.state = {positions: {}, disableAnimate: false};
		this.debounceUpdatePosition = utils.debounce(() => this.updatePosition(this.props.messages, true), 200);
		this.throttleButtonClick = utils.throttle(this.buttonClick, 500);
	}

	componentDidMount() {
		utils.onEvent(window, 'resize', this.debounceUpdatePosition);
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.messages !== this.props.messages) {
			this.updatePosition(nextProps.messages, false);
		}
	}

	componentWillUnmount() {
		this.debounceUpdatePosition.clear();
		clearTimeout(this.animTimer);
		utils.offEvent(window, 'resize', this.debounceUpdatePosition);
	}

	updatePosition(messages, disableAnimate) {
		const positions = {};

		messages.forEach((message, index) => {
			let height = 0;

			for (let i = 0; i < index; i++) {
				if (!messages[i].ending) {
					height += this.refs[`message${messages[i].id}`] ? this.refs[`message${messages[i].id}`].offsetHeight : 46;
				}
			}
			positions[message.id] = height;
		});
		this.setState({positions, disableAnimate}, () => {
			this.animTimer = disableAnimate && setTimeout(() => this.setState({disableAnimate: false}), 100);
		});
	}

	dismissMessage(e, message) {
		e.preventDefault();
		if (message.dismissable) {
			this.props.dispatch('endMessage', message.id);
		}
	}

	buttonClick(e, button, message) {
		e.preventDefault();
		this.props.dispatch('endMessage', message.id);
		button.onAction && this.props.dispatch('massDispatch', button.onAction);
	}

	render() {
		const messages = this.props.messages.map((message, index) => {

			return (
				<li key={message.id}
					ref={`message${message.id}`}
					style={{bottom: this.state.positions[message.id] + 'px', transition: this.state.disableAnimate ? 'none' : undefined}}
					className={utils.getClassName({
						starting: message.starting,
						ending: message.ending,
						dismissable: message.dismissable,
					})}>
					<a href="#" draggable="false" tabIndex={message.dismissable ? 0 : -1} onClick={(e) => this.dismissMessage(e, message)}>
						<span className="text">
							<span className="access">Dismiss message</span>
							{message.text}
						</span>
						{message.buttons && message.buttons.length > 0 &&
							<span className="buttons">
								{message.buttons.map(button => (
									<button className={utils.getClassName({'button-small': true, primary: button.primary})}
										onClick={(e) => this.throttleButtonClick(e, button, message)}>
										{button.title}
									</button>
								))}
							</span>
						}
					</a>
				</li>
			);
		}).reverse();

		return (
			<ul className="message-box">
				{messages}
			</ul>
		);
	}
}

export default Messages;
