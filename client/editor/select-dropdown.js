
import React from 'react';

import utils from 'utils';

class SelectDropdown extends React.Component {

	constructor(props) {
		super(props);
		utils.bindThis(this, ['setFocus', 'focusout', 'keydown']);
		this.optionsRef = [];
	}

	componentDidMount() {
		const selectedIndex = this.props.options.findIndex(option => this.props.selected && option.value === this.props.selected.value);

		window.addEventListener('focusout', this.focusout);
		this.setFocus(selectedIndex > -1 ? selectedIndex : 0);
	}

	componentWillUnmount() {
		clearTimeout(this.timer);
		window.removeEventListener('focusout', this.focusout);
	}

	setFocus(index) {
		this.optionsRef[index].focus();
		this.refs.menu.scrollTop = this.optionsRef[index].offsetTop;
	}

	focusout(e) {
		this.timer = setTimeout(() => {
			if (this.refs.menu && !this.refs.menu.contains(document.activeElement) && document.activeElement !== this.props.selectRef) {
				this.props.onClick();
			}
		}, 100);
	}

	keydown(e) {
		const activeIndex = this.optionsRef.indexOf(document.activeElement);
		const options = this.props.options;

		// Up and down keys
		if (e.keyCode === 38 || e.keyCode === 40) {
			let newIndex = activeIndex;

			e.preventDefault();
			do {
				newIndex += e.keyCode === 38 ? -1 : 1;
			} while (options[newIndex] && options[newIndex].disabled);

			if (options[newIndex]) {
				this.setFocus(newIndex);
			}
		// Space and Enter
		} else if (e.keyCode === 32 || e.keyCode === 13) {
			this.click(e, this.props.options[activeIndex]);
		// Escape and Tab
		} else if (e.keyCode === 27 || e.keyCode === 9) {
			this.click(e, this.props.selected);
		}
		this.props.searchOption(e);
	}

	click(e, option) {
		e.preventDefault();
		if (!option.disabled) {
			this.props.onClick(option);
		}
	}

	render() {
		const selectPosition = this.props.selectRef && this.props.selectRef.getBoundingClientRect();
		const isAbove = this.props.selectRef && window.innerHeight - selectPosition.bottom < 200;

		return (
			<div ref="menu" onKeyDown={this.keydown} className={utils.getClassName({
					options: true,
					above: isAbove,
				})}>
				<ul>
					{this.props.options.map((option, index) => (
						<li
							key={option.value}
							className={utils.getClassName({
								selected: option === this.props.selected,
								placeholder: !option.value,
								disabled: option.disabled
							})}
							onClick={(e) => this.click(e, option)}
							ref={a => this.optionsRef.push(a)}
							tabIndex={option.disabled ? -1 : 0}
							id={this.props.selectId + '-' + option.value}
							role="option">
							{option.icon &&
								<span className={`auto-icon ${option.shape || ''}`}>
									<span style={utils.getIconStyle(option.icon)} />
								</span>
							}
							{option.title || option.value}
							{option.desc &&
								<span className="desc">{option.desc}</span>
							}
						</li>
					))}
				</ul>
			</div>
		);
	}
}

export default SelectDropdown;
