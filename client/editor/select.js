
import './select.scss';

import React from 'react';
import PropTypes from 'prop-types';

import SelectDropdown from './select-dropdown';
import utils from 'utils';


class Select extends React.Component {

	constructor(props) {
		super(props);
		utils.bindThis(this, ['keydown', 'clickSelect', 'clickOption']);
		this.state = {
			isOpen: false,
			selected: utils.pickObj(this.props.options, 'value', this.props.defaultValue) || this.props.options[0]
		};
	}

	keydown(e) {
		// Space, Up and Down
		if (e.keyCode === 32 || e.keyCode === 38 || e.keyCode === 40) {
			e.preventDefault();
			this.clickSelect();
		}
	}

	clickSelect() {
		if (!this.props.disabled) {
			this.setState({isOpen: !this.state.isOpen});
		}
	}

	clickOption(selected) {
		if (typeof selected === 'object') {
			this.setState({selected}, () => {
				const e = {target: {value: selected.value}};

				this.props.onChange(e);
			});
			this.refs.select.focus();
		}
		this.clickSelect();
	}

	render() {
		const options = this.props.options;

		return (
			<div className="select-box" role="listbox" aria-activedescendant={this.props.selectId + '-' + this.state.selected.value}>
				<input defaultValue={this.state.selected.value} id={this.props.selectId} onClick={this.clickSelect} tabIndex="-1" />
				<div className={utils.getClassName({
						select: true,
						open: this.state.isOpen,
						placeholder: !this.state.selected.value,
						disabled: this.props.disabled
					})}
					onClick={this.clickSelect}
					onKeyDown={this.keydown}
					tabIndex={this.props.disabled ? -1 : 0}
					ref="select">
					{this.state.selected.title || this.state.selected.value}
				</div>
				{this.state.isOpen &&
					<SelectDropdown
						options={this.props.options}
						selectId={this.props.selectId}
						selectRef={this.refs.select}
						selected={this.state.selected}
						onClick={this.clickOption} />
				}
			</div>
		);
	}
}

export default Select;
