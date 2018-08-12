
import './autocomplete.scss';

import React from 'react';
import PropTypes from 'prop-types';

import utils from 'utils';

import AutocompleteDropdown from './autocomplete-dropdown';

const specialOptions = {
	noMatch: {title: 'No matches found', value: '', disabled: true, special: true,},
	tooShort: {title: 'Please enter more characters', value: '', disabled: true, special: true,},
	loading: {title: 'Loading...', value: '', disabled: true, special: true,},
};


class Autocomplete extends React.Component {

	constructor(props) {
		super(props);
		utils.bindThis(this, ['onInputChange', 'onInputClick', 'onInputKeyDown', 'clickOption', 'clearValue']);

		const emptyOption = this.props.options.find(option => option.value === '');

		this.state = {
			isOpen: false,
			selected: this.props.options.find(option => option.title === this.props.value),
			placeholder: this.props.placeholder || this.props.options.find(option => option.value === '').title,
			options: this.props.options,
			focusDropdown: false,
		};
		this.asyncCounter = 0;
	}

	componentWillReceiveProps(nextProps) {
		const isOptionsChange = this.props.options !== nextProps.options;
		const options = isOptionsChange ? nextProps.options : this.state.options;
		const isValChange = this.props.value !== nextProps.value;
		const selected = (this.state.selected || {}).value === (nextProps.matchingOption || {}).value ? nextProps.matchingOption : options.find(option => option.title === nextProps.value);

		if (isOptionsChange || isValChange) {
			this.setState({selected, options});
		}
	}

	componentWillUnmount() {
		clearTimeout(this.asyncTimer);
	}

	onInputChange(e) {
		const value = e.currentTarget.value;
		const wildValue = value.toLowerCase().trim();
		const matchingOption = utils.pickWild(this.props.options, 'title', wildValue);

		if (matchingOption) {
			return this.setState({
				selected: {...matchingOption},
				options: this.props.options,
				isOpen: true,
			}, () => {
				this.props.onChange({
					target: {
						value: matchingOption.value ? matchingOption.title || matchingOption.value : '',
					},
					type: 'change',
				});
			});
		}

		if (this.props.asyncOptions) {
			const startCounter = ++this.asyncCounter;

			if (value.length < this.props.asyncMinLength) {
				return this.setState({
					selected: undefined,
					options: [specialOptions.tooShort],
				}, () => {
					this.props.onChange({target: {value}, type: 'change'});
				});
			}
			this.setState({
				selected: undefined,
				options: [specialOptions.loading],
				isOpen: true,
			}, () => {
				this.props.onChange({target: {value}, type: 'change'});
			});
			clearTimeout(this.asyncTimer);
			this.asyncTimer = setTimeout(() => {
				this.props.asyncOptions(value).then((options) => {
					if (startCounter === this.asyncCounter) {
						const matched = utils.pickWild(options, 'title', wildValue);

						this.setState({
							options: options.length > 0 ? options : [specialOptions.noMatch],
							selected: matched ? {...matched} : undefined,
						}, () => {
							this.props.onChange({target: {value}, type: 'change', options})
						});
					}
				});
			}, 300);

		} else {
			const filteredOptions = this.props.options.filter(item => {
				return item.title.toLowerCase().trim().indexOf(wildValue) > -1 || item.desc.toLowerCase().trim().indexOf(wildValue) > -1;
			});

			if (filteredOptions.length === 0) {
				filteredOptions.push(specialOptions.noMatch);
			}
			this.setState({
				selected: undefined,
				options: filteredOptions,
				isOpen: true,
			}, () => {
				this.props.onChange({target: {value}, type: 'change'});
			});
		}
	}

	onInputClick(e) {
		this.setState({
			isOpen: true,
			options: this.state.selected ? this.props.options : this.state.options,
		});
	}

	onInputKeyDown(e) {
		if ((e.keyCode === 38 || e.keyCode === 40) && this.state.selected && !this.state.isOpen) {
			e.preventDefault();
			const newIndex = Math.min(this.state.options.length - 1,
												Math.max(0, this.state.options.findIndex(option => option.value === this.state.selected.value) + (e.keyCode === 38 ? -1 : 1)));

			this.clickOption(this.state.options[newIndex]);

		// Up, Down and Tab when dropdown open
		} else if (e.keyCode === 38 || e.keyCode === 40 || e.keyCode === 9 && !e.shiftKey && this.state.isOpen && this.state.options.length) {
			e.preventDefault();
			this.setState({isOpen: true, focusDropdown: true,}, () => {
				setTimeout(() => {
					this.setState({focusDropdown: false});
				}, 500);
			});
		}
	}

	clickOption(selected) {
		if (typeof selected === 'object') {
			selected = {...selected};
			this.setState({selected}, () => {
				this.props.onChange({
					target: {value: selected.value ? selected.title || selected.value : '',},
					matchingOption: selected,
				});
			});
			this.refs.input.value = selected && selected.value ? selected.title || selected.value : '';
			this.refs.input.focus();
		}
		this.setState({isOpen: false, options: this.props.options});
	}

	clearValue(e) {
		e.preventDefault();
		this.props.onChange({target: {value: ''}, type: 'change', matchingOption: undefined});
		this.setState({selected: undefined});
		this.refs.input.focus();
	}

	render() {
		const {selected, placeholder, isOpen, options, focusDropdown} = this.state;

		return (
			<div role="listbox" aria-activedescendant={`${this.props.inputId}-${selected ? selected.value : ''}`}
				className={utils.getClassName({
					'autocomplete-box': true,
					selected: selected && selected.value,
					'has-icon': selected && selected.icon,
				})}>
				<input
					value={this.props.value}
					id={this.props.inputId}
					onFocus={this.onInputClick}
					onClick={this.onInputClick}
					onChange={this.onInputChange}
					onKeyDown={this.onInputKeyDown}
					disabled={this.props.disabled}
					placeholder={placeholder}
					autoComplete="off"
					type="text"
					ref="input" />
				{selected && selected.icon &&
					<span className={`auto-icon ${selected.iconStyle || ''}`}>
						<span style={utils.getIconStyle(selected.icon)} />
					</span>
				}
				{selected && selected.value &&
					<button type="button" onClick={this.clearValue} className="button icon close-button"><i>close</i></button>
				}
				{isOpen &&
					<AutocompleteDropdown
						options={options}
						inputId={this.props.inputId}
						inputRef={this.refs.input}
						autoFocus={focusDropdown}
						selected={selected}
						onClick={this.clickOption} />
				}
			</div>
		);
	}
}

export default Autocomplete;
