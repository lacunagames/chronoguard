
import './select.scss';

import React from 'react';

import SelectDropdown from './select-dropdown';
import utils from 'utils';


class Select extends React.Component {

	constructor(props) {
		super(props);
		utils.bindThis(this, ['keydown', 'clickSelect', 'clickOption']);
		this.state = {
			isOpen: false,
			selected: this.props.options.find(option => option.value === this.props.value) || this.props.options[0]
		};
	}

	componentWillReceiveProps(nextProps) {
		if (this.props.options !== nextProps.options || this.props.value !== nextProps.value) {
			this.setState({selected: nextProps.options.find(option => option.value === nextProps.value) || nextProps.options[0]});
		}
	}

	keydown(e) {
		// Space, Up and Down
		if (e.keyCode === 32 || e.keyCode === 38 || e.keyCode === 40) {
			e.preventDefault();
			this.clickSelect();
		}
	}

	clickSelect(e) {
		if (!this.props.disabled) {
			this.setState({isOpen: !this.state.isOpen});
		}
	}

	clickOption(selected) {
		if (typeof selected === 'object') {
			this.setState({selected}, () => {
				this.props.onChange({target: {value: selected.value}, matchingOption: selected});
			});
			this.refs.select.focus();
		}
		this.clickSelect();
	}

	render() {
		const {options, selectId, disabled} = this.props;
		const {selected, isOpen} = this.state;

		return (
			<div className="select-box" role="listbox" aria-activedescendant={selectId + '-' + selected.value}>
				<input value={selected.value} id={selectId} onClick={this.clickSelect} tabIndex="-1" />
				<div className={utils.getClassName({
						select: true,
						open: isOpen,
						placeholder: !selected.value,
						'has-icon': selected.icon,
						disabled,
					})}
					onClick={this.clickSelect}
					onKeyDown={this.keydown}
					tabIndex={disabled ? -1 : 0}
					ref="select">
					{selected && selected.icon &&
						<span className={`auto-icon ${selected.iconStyle || ''}`}>
							<span style={utils.getIconStyle(selected.icon)} />
						</span>
					}
					{selected.title || selected.value}
					<i>expand_more</i>
				</div>
				{isOpen &&
					<SelectDropdown
						options={options}
						selectId={selectId}
						selectRef={this.refs.select}
						selected={selected}
						onClick={this.clickOption} />
				}
			</div>
		);
	}
}

export default Select;
