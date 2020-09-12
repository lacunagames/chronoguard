
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
			selected: !this.props.partialComplete && this.props.options.find(option => option.title === this.props.value),
			placeholder: this.props.placeholder || (this.props.options.find(option => option.value === '') || {}).title || '',
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
			this.setState({selected: !this.props.partialComplete && selected, options});
		}
	}

	componentWillUnmount() {
		clearTimeout(this.asyncTimer);
	}

	onInputChange(e) {
		const partial = this.props.partialComplete;
		const value = e.currentTarget.value;
		const caretPos = e.currentTarget.selectionStart;
		const words = value.substring(0, caretPos).split(' ');
		const wildValue = (partial ? words[words.length - 1] : value).toLowerCase().trim();
		const matchingOption = utils.pickWild(this.props.options, 'title', wildValue);

		if (matchingOption && !partial) {
			return this.setState({
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

		const filteredOptions = this.props.options.filter(item => {
			return item.title.toLowerCase().trim().indexOf(wildValue) > -1 ||
								item.desc && item.desc.toLowerCase().trim().indexOf(wildValue) > -1;
		});

		if (filteredOptions.length === 0 && !partial) {
			filteredOptions.push(specialOptions.noMatch);
		}
		this.setState({
			options: filteredOptions,
			isOpen: !!filteredOptions.length,
		}, () => {
			this.props.onChange({target: {value}, type: 'change'});
			setTimeout(() => this.refs.input.setSelectionRange(caretPos, caretPos), 0);
		});
	}

	onInputClick(e) {
		const eType = e.type;

		if (e.type === 'blur') {
			return this.inputFocused = false;
		}
		this.setState({
			isOpen: e.type === 'focus' || !this.inputFocused || !this.state.isOpen,
			options: this.state.selected ? this.props.options : this.state.options,
		}, () => {
			if (eType === 'click') {
				this.inputFocused = true;
			}
		});
	}

	onInputKeyDown(e) {
		// Up, Down to select neighbour items when dropdown closed
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
		let caretPos = this.refs.input.selectionStart;

		if (typeof selected === 'object') {
			let newValue = selected.value ? selected.title || selected.value : '';

			if (this.props.partialComplete) {
				const words = this.props.value.substring(0, caretPos).split(' ');
				const afterCaret = this.props.value.substring(caretPos);

				words[words.length - 1] = newValue;
				caretPos = words.join(' ').length;
				newValue = words.join(' ') + afterCaret;
			}

			this.props.onChange({
				target: {value: newValue},
				matchingOption: !this.props.partialComplete && {...selected},
			});
			this.refs.input.value = newValue;
			this.refs.input.focus();
		}
		this.setState({
			isOpen: false,
			options: this.props.partialComplete ? this.state.options : this.props.options,
		}, () => {
			this.props.partialComplete && setTimeout(() => this.refs.input.setSelectionRange(caretPos, caretPos), 0);
		});
	}

	clearValue(e) {
		e.preventDefault();
		this.props.onChange({target: {value: ''}, type: 'change', matchingOption: undefined});
		this.inputFocused = true;
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
					'has-invalids': options.find(option => option.valid === false),
				})}>
				<input
					autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
					value={this.props.value}
					id={this.props.inputId}
					onFocus={this.onInputClick}
					onBlur={this.onInputClick}
					onClick={this.onInputClick}
					onChange={this.onInputChange}
					onKeyDown={this.onInputKeyDown}
					disabled={this.props.disabled}
					placeholder={placeholder}
					autoComplete="off"
					type="text"
					ref="input" />
				{selected && selected.icon &&
					<span className={`auto-icon ${selected.shape || ''}`}>
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
