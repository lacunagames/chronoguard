
import React from 'react';

import utils from 'utils';

class AutocompleteDropdown extends React.Component {

	constructor(props) {
		super(props);
		utils.bindThis(this, ['setFocus', 'focusout', 'keydown', 'setOptionsRef']);
		this.optionsRef = [];
	}

	componentDidMount() {
		window.addEventListener('focusout', this.focusout);

		if (this.props.options && this.props.selected) {
			const selectedIndex = utils.pickWildIndex(this.props.options, 'value', this.props.selected && this.props.selected.value);

			this.refs.menu.scrollTop = this.optionsRef[Math.max(0, selectedIndex)].offsetTop;
		}
	}

	componentWillUnmount() {
		clearTimeout(this.timer);
		window.removeEventListener('focusout', this.focusout);
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.autoFocus && nextProps.autoFocus !== this.props.autoFocus) {
			setTimeout(() => {
				this.setFocus(utils.pickWildIndex(nextProps.options, 'value', nextProps.selected && nextProps.selected.value));
			});
		}
	}

	setFocus(index) {
		index = Math.max(0, index);
		this.optionsRef[index].focus();
		this.refs.menu.scrollTop = this.optionsRef[index].offsetTop;
	}

	focusout(e) {
		clearTimeout(this.timer);
		this.timer = setTimeout(() => {
			if (this.refs.menu && !this.refs.menu.contains(document.activeElement)) {
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
			this.onClick(e, this.props.options[activeIndex]);
		// Escape and Tab
		} else if (e.keyCode === 27 || e.keyCode === 9) {
			this.onClick(e, this.props.selected);


		}
	}

	onClick(e, option) {
		e.preventDefault();
		if (!option || !option.disabled) {
			this.props.onClick(option);
		}
	}

	setOptionsRef(el, index) {
		if (index === 0) {
			this.optionsRef = [];
		}
		this.optionsRef.push(el);
	}

	render() {
		const selectPosition = this.props.inputRef && this.props.inputRef.getBoundingClientRect();
		const isAbove = this.props.inputRef && window.innerHeight - selectPosition.bottom < 200;

		this.optionsRef = [];

		return (
			<div ref="menu" onKeyDown={this.keydown} className={utils.getClassName({
					options: true,
					above: isAbove,
				})}>
				<ul>
					{
						this.props.options.map((option, index) => (
							<li
								key={option.value}
								className={utils.getClassName({
									selected: this.props.selected && this.props.selected.value && option.value === this.props.selected.value,
									placeholder: !option.value,
									disabled: option.disabled,
									special: option.special,
									valid: option.valid,
									invalid: option.valid === false,
								})}
								onClick={(e) => this.onClick(e, option)}
								ref={el => this.setOptionsRef(el, index)}
								tabIndex={option.disabled ? -1 : 0}
								id={this.props.inputId + '-' + option.value}
								role="option">
								{option.valid === false &&
									<i className="validity">warning</i>
								}
								{option.icon &&
									<span className={`auto-icon ${option.iconStyle || ''}`}>
										<span style={utils.getIconStyle(option.icon)} />
									</span>
								}
								{option.title || option.value}
								{option.desc &&
									<span className="desc">{option.desc}</span>
								}
							</li>
						))
					}
				</ul>
			</div>
		);
	}
}

export default AutocompleteDropdown;
