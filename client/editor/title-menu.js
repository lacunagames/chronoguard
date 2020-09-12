
import './title-menu.scss';

import React from 'react';

import utils from 'utils';

const options = [
	{value: 'events', title: 'Events', link: '/event-editor'},
	{value: 'state', title: 'State', link: '/state-editor'},
	{value: 'conditions', title: 'Conditions', link: '/condition-editor'},
];

class TitleMenu extends React.Component {

	constructor(props) {
		super(props);
		utils.bindThis(this, ['toggleMenu']);

		this.state = {
			isOpen: false,
		};
	}

	componentWillUnmout() {
		utils.offEvent(window, 'click', toggleMenu);
		clearTimeout(this.blurTimer);
	}

	toggleMenu(e) {
		if (e && this.refs.titleMenu.contains(e.target)) {
			e.stopPropagation();
		}
		this.setState({isOpen: !this.state.isOpen}, () => {
			utils[this.state.isOpen ? 'onEvent' : 'offEvent'](window, 'click', this.toggleMenu);
			this.state.isOpen && utils.onEvent(this.refs.titleMenu, 'focusout', () => {
				clearTimeout(this.blurTimer);
				this.blurTimer = setTimeout(() => {
					if (!this.refs.titleMenu.contains(document.activeElement)) {
						this.toggleMenu();
					}
				}, 0);
			});
		});
	}

	render() {
		const {isOpen} = this.state;
		const selectedOption = options.find(opt => opt.value === this.props.selected);

		return (
			<div className="title-menu" ref="titleMenu">
				<button type="button" onClick={this.toggleMenu} className={isOpen ? 'open' : ''}>
					<i>menu</i> {selectedOption.title}
				</button>
				{isOpen &&
					<div className="menu">
						<ol>
							{options.filter(opt => opt !== selectedOption).map(opt => (
								<li><a href={opt.link}>{opt.title}</a></li>
							))}
						</ol>
					</div>
				}
			</div>
		);
	}
}

export default TitleMenu;
