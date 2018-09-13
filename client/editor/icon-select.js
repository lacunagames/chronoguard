
import './icon-select.scss';

import React from 'react';

import Tooltip from '../components/tooltip';
import Modal from '../components/modal';
import utils from 'utils';


class IconSelect extends React.Component {

	constructor(props) {
		super(props);
		utils.bindThis(this, ['iconSelect', 'toggleModal', 'toggleTooltip']);
		this.state = {
			modalOpen: false,
			modalPos: undefined,
			buttonTooltip: false,
		};
	}

	componentWillReceiveProps(nextProps) {
	}

	iconSelect(iconName) {
		this.props.onChange({target: {value: iconName}});
	}

	toggleModal(e) {
		e.preventDefault();
		this.setState({
			modalOpen: !this.state.modalOpen,
			modalPos: this.refs.button.getBoundingClientRect(),
		});
	}

	toggleTooltip(type, isOpen) {
		this.setState({[`${type}Tooltip`]: isOpen});
	}

	render() {
		const {options, shape, disabled, id, value, label, title} = this.props;
		const {buttonTooltip, modalPos, modalOpen} = this.state;
		const shapeVal = (typeof shape === 'object' ? shape.calculated = shape.valueFn(shape.origin.state[shape.valueOf].value)
																								: shape) || '';

		return (
			<React.Fragment>
				<Tooltip show={buttonTooltip} toggleTooltip={isOpen => this.toggleTooltip('button', isOpen)}>
					<button data-tooltip-trigger
						type="button"
						id={id}
						className={utils.getClassName({
							'icon-raised select-icon': true,
							[shapeVal]: true,
						})}
						ref="button"
						disabled={disabled}
						onClick={this.toggleModal}>
						<span style={utils.getIconStyle(value)} />
					</button>
					<p>{title}</p>
				</Tooltip>
				<Modal show={this.state.modalOpen} pos={this.state.modalPos} locked={false} onClose={this.toggleModal}>
					<h3 data-modal-head>{title}</h3>
					<form onSubmit={this.toggleModal}>
						<input type="submit" className="access" tabindex="-1" />
						<fieldset className="icon-radios">
							{options.map(option => (
								<Tooltip show={this.state[`${option.value}IconTooltip`]}
									toggleTooltip={isOpen => this.toggleTooltip(`${option.value}Icon`, isOpen)}>
									<div key={option.value} data-tooltip-trigger>
										<input type="radio"
											value={option.value}
											name="icon-radios"
											id={`icon-input-${option.value}`}
											checked={value === option.value}
											onChange={() => this.iconSelect(option.value)} />
										<label htmlFor={`icon-input-${option.value}`} className={shapeVal}>
											<span style={utils.getIconStyle(option.value)}>{option.title || option.value}</span>
										</label>
									</div>
									<p>{option.title || option.value}</p>
								</Tooltip>
							))}
						</fieldset>
					</form>
				</Modal>
			</React.Fragment>
		);
	}
}

export default IconSelect;
