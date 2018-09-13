
import './multicomplete.scss';

import React from 'react';

import utils from 'utils';

import Autocomplete from './autocomplete';


class Multicomplete extends React.Component {

	constructor(props) {
		super(props);
		utils.bindThis(this, ['onAutoChange', 'removeValue']);

		this.state = {
			autoValue: '',
			options: this.props.options.filter(option => !this.props.value.find(match => match.value === option.value)),
		};
	}

	componentWillReceiveProps(nextProps) {
		if (this.props.value !== nextProps.value) {
			this.setState({options: nextProps.options.filter(option => !nextProps.value.find(match => match.value === option.value))});
		}
	}


	onAutoChange(e) {
		if (e.matchingOption) {
			this.props.onChange({target: {value: [...this.props.value, {...e.matchingOption}]}});
			this.setState({
				autoValue: '',
			})
		} else {
			this.setState({autoValue: e.target.value});
		}
	}

	removeValue(e, valObj) {
		e.preventDefault();
		this.props.onChange({target: {value: this.props.value.filter(matchObj => matchObj.value !== valObj.value)}});
	}

	render() {
		const {inputId, disabled, value} = this.props;
		const {options, autoValue} = this.state;

		return (
			<div className="multicomplete">
				<ul className={utils.getClassName({list: true, empty: value.length === 0})}>
					{value.map(valObj => (
						<li>
							<div>
								{valObj.icon &&
									<span className={`auto-icon ${valObj.shape || ''}`}>
										<span style={utils.getIconStyle(valObj.icon)} />
									</span>
								}
								<span className="text">{valObj.title || valObj.value}</span>
								<button type="button" className="icon remove" onClick={e => this.removeValue(e, valObj)}><i>close</i></button>
							</div>
						</li>
					))}
				</ul>
				<Autocomplete
					inputId={inputId}
					options={options}
					placeholder=""
					onChange={this.onAutoChange}
					disabled={disabled}
					value={autoValue} />
			</div>
		);
	}
}

export default Multicomplete;
