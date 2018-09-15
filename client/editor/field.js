
import React from 'react';

import utils from 'utils';
import Select from './select';
import Autocomplete from './autocomplete';
import Multicomplete from './multicomplete';
import MultiAdd from './multi-add';
import IconSelect from './icon-select';

class Field extends React.Component {

	render() {
		const field = this.props.config || {};
		const isRequired = !!(field.rules && field.rules.find(rule => rule.type === 'required'));
		const invalidRuleIndex = field.invalid && field.rules.findIndex(rule => rule.type === field.invalid);
		const renderFieldType = () => {
			switch (field.type) {

				case 'multiAdd':
					return (
						<MultiAdd
							id={field.id}
							onChange={field.onChange}
							value={field.value}
							label={field.label}
							config={field.config}
							disabled={field.disabled}
							maxLength={field.maxLength}
							dataChange={field.dataChangeCount} />
					);


				case 'select':
					return (
						<Select
							selectId={field.id}
							options={field.options}
							onChange={field.onChange}
							disabled={field.disabled}
							value={field.value} />
					);

				case 'iconSelect':
					return (
						<IconSelect
							id={field.id}
							options={field.options}
							onChange={field.onChange}
							disabled={field.disabled}
							shape={field.shape}
							title={field.label || field.placeholder}
							value={field.value} />
					);

				case 'autocomplete':
					return (
						<Autocomplete
							inputId={field.id}
							options={field.options}
							asyncOptions={field.asyncOptions}
							asyncMinLength={field.asyncMinLength}
							placeholder={`${field.placeholder || field.label} ${isRequired ? ' *' : ''}`}
							onChange={field.onChange}
							disabled={field.disabled}
							value={field.value}
							matchingOption={field.matchingOption} />
					);

				case 'multicomplete':
					return (
						<Multicomplete
							inputId={field.id}
							options={field.options}
							placeholder={`${field.placeholder || field.label} ${isRequired ? ' *' : ''}`}
							onChange={field.onChange}
							disabled={field.disabled}
							value={field.value} />
					);

				case 'radio':
				case 'toggle':
					return (
						<fieldset className={utils.getClassName({
								'has-legend': field.label,
								'toggle-buttons': field.type === 'toggle',
							})}>
							{field.label &&
								<legend>
									{field.label}
									{isRequired &&
										<span className="asterisk" />
									}
								</legend>
							}
							{field.options.map((radio, index) => (
								<div key={radio.value}>
									<input type="radio"
										value={radio.value}
										name={field.name}
										id={field.id + index}
										checked={field.value === radio.value}
										disabled={radio.disabled || field.disabled}
										onChange={field.onChange} />
									<label htmlFor={field.id + index}>{radio.title || radio.value}</label>
								</div>
							))}
						</fieldset>
					);

				case 'checkbox':
					return (
						<div className="check-wrap">
							<input type="checkbox"
								value={field.checkedValue || '1'}
								checked={field.value === (typeof field.checkedValue === 'undefined' ? '1' : field.checkedValue)}
								onChange={field.onChange}
								name={field.name}
								disabled={field.disabled}
								id={field.id} />
							<label htmlFor={field.id}>
								{field.label}
								{isRequired &&
									<span className="asterisk" />
								}
							</label>
						</div>
					);

				case 'checkboxGroup':
					return (
						<fieldset className={field.label ? 'has-legend' : ''}>
							{field.label &&
								<legend>
									{field.label}
									{isRequired &&
										<span className="asterisk" />
									}
								</legend>
							}
							{field.options.map((check, index) => (
								<div key={check.value}>
									<input type="checkbox"
										value={check.value}
										name={field.name}
										id={field.id + index}
										checked={field.value.indexOf(check.value) > -1}
										disabled={check.disabled || field.disabled}
										onChange={field.onChange} />
									<label htmlFor={field.id + index}>{check.title || check.value}</label>
								</div>
							))}
						</fieldset>
					);

				case 'textarea':
					return (
						<div className="input-wrap">
							<textarea
								id={field.id}
								name={field.name}
								disabled={field.disabled}
								onChange={field.onChange}
								onBlur={field.onChange}
								placeholder={(field.placeholder || field.label) + (isRequired ? ' *' : '')}
								value={field.value} />
						</div>
					);

				case 'text':
				default:
					return (
						<div className="input-wrap">
							<input type={field.type}
								id={field.id}
								name={field.name}
								disabled={field.disabled}
								onChange={field.onChange}
								onBlur={field.onChange}
								placeholder={(field.placeholder || field.label || '') + (isRequired ? ' *' : '')}
								value={field.value} />
						</div>
					);
			}
		}

		if (field.isHidden) {
			return (null);
		}

		return (
			<div className={utils.getClassName({
				'row-field': true,
				invalid: field.invalid,
				valid: !field.invalid,
				hidden: field.type === 'hidden',
				'no-label': !field.label || field.type === 'checkbox',
				'hide-validation': field.hideValidation,
				'icon-select-field': field.type === 'iconSelect',
				})}>
				{field.label && !['radio', 'toggle', 'checkbox', 'checkboxGroup'].includes(field.type) &&
					<label htmlFor={field.id} className={!field.value ? 'invisible' : ''}>
						{field.label}
						{isRequired &&
							<span className="asterisk" />
						}
					</label>
				}
				{renderFieldType()}
				<span class="valid-signs">
					<i className={`success ${field.invalid !== '' ? 'invisible' : ''}`}>check_circle_outline</i>
					<i className={`error ${!field.invalid ? 'invisible' : ''}`}>error_outline</i>
				</span>
				{!field.invalid && !field.info && field.helpText &&
					<div className="help">{field.helpText}</div>
				}
				{!field.invalid && field.info &&
					<div className="help info">{field.infos && field.infos[field.info] || field.defaultInfoText}</div>
				}
				{field.invalid &&
					<div className="help error">{field.rules[invalidRuleIndex].errorText || field.defaultErrorText}</div>
				}
			</div>
		);
	}
}

export default Field;
