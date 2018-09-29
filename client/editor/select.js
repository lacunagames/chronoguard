
import './select.scss';

import React from 'react';

import SelectDropdown from './select-dropdown';
import utils from 'utils';


class Select extends React.Component {

	constructor(props) {
		super(props);
		utils.bindThis(this, ['keydown', 'clickSelect', 'clickOption', 'searchOption']);
		this.state = {
			isOpen: false,
			selected: this.props.options.find(option => option.value === this.props.value) || !this.props.value && this.props.options[0]
		};
		this.searchStr = '';
	}

	componentWillReceiveProps(nextProps) {
		if (this.props.options !== nextProps.options || this.props.value !== nextProps.value) {
			this.setState({
				selected: nextProps.options.find(option => option.value === nextProps.value) || !nextProps.value && nextProps.options[0]
			});
		}
	}

	componentWillUnmount() {
		clearTimeout(this.searchTimer);
	}

	keydown(e) {
		// Space, Up and Down
		if (e.keyCode === 32 || e.keyCode === 38 || e.keyCode === 40) {

			e.preventDefault();
			if (this.state.isOpen || e.keyCode === 32) {
				this.clickSelect();
			} else {
				const {options} = this.props;
				const index = options.findIndex(option => this.state.selected && option.value === this.state.selected.value);
				let newIndex = index;
				do {
					newIndex += e.keyCode === 38 ? -1 : 1;
				} while (options[newIndex] && options[newIndex].disabled);
				options[newIndex] && this.clickOption(options[newIndex]);
			}
		}

		this.searchOption(e);
	}

	searchOption(e) {
		const char = String.fromCharCode((96 <= e.keyCode && e.keyCode <= 105)? e.keyCode - 48 : e.keyCode);

		if (/^[a-z0-9\s\-\:]+$/i.test(char)) {
			this.searchStr += char.toLowerCase();
			this.searchTimer = setTimeout(() => this.searchStr = '', 2000);

			const matchedOption = this.props.options.find(opt => (opt.title || opt.value).toLowerCase().indexOf(this.searchStr) === 0);

			matchedOption && this.clickOption(matchedOption, true);
		}
	}


	clickSelect(e) {
		if (!this.props.disabled) {
			this.setState({isOpen: !this.state.isOpen});
		}
	}

	clickOption(selected, keepOpen) {
		if (typeof selected === 'object') {
			this.setState({selected}, () => {
				this.props.onChange({target: {value: selected.value}, matchingOption: selected});
			});
			this.refs.select.focus();
		}
		this.state.isOpen && !keepOpen && this.clickSelect();
	}

	render() {
		const {options, selectId, disabled, value} = this.props;
		const {selected, isOpen} = this.state;

		return (
			<div className="select-box" role="listbox" aria-activedescendant={selectId + '-' + value}>
				<input value={value} id={selectId} onClick={this.clickSelect} tabIndex="-1" />
				<div className={utils.getClassName({
						select: true,
						open: isOpen,
						placeholder: !value,
						'has-icon': selected && selected.icon,
						disabled,
					})}
					onClick={this.clickSelect}
					onKeyDown={this.keydown}
					tabIndex={disabled ? -1 : 0}
					ref="select">
					{selected && selected.icon &&
						<span className={`auto-icon ${selected.shape || ''}`}>
							<span style={utils.getIconStyle(selected.icon)} />
						</span>
					}
					{selected && selected.title || value}
					<i>expand_more</i>
				</div>
				{isOpen &&
					<SelectDropdown
						options={options}
						selectId={selectId}
						selectRef={this.refs.select}
						selected={selected}
						onClick={this.clickOption}
						searchOption={this.searchOption} />
				}
			</div>
		);
	}
}

export default Select;
