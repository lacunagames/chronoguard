
import React from 'react';

import utils from 'utils';

class ErrorSummary extends React.Component {


    render() {
        const labelFields = ['text', 'select', 'autocomplete', 'textarea', 'date'];
        const errorFields = Object.keys(this.props.fields)
                                .filter((fieldName) => this.props.fields[fieldName].invalid)
                                .map((fieldName) => {
                                    const field = this.props.fields[fieldName];
                                    const rule = utils.pickObj(field.rules, 'type', field.invalid);

                                    return Object.assign({}, field, {
                                        errorText: rule && rule.errorText ? rule.errorText : field.defaultErrorText
                                    });
                                });

        return (
            <div className={`error-summary ${this.props.hidden || errorFields.length === 0 ? 'hidden' : ''}`}>
                <h2 className="h4" role="alert">{errorFields.length === 1 ? 'There is an error' : 'There are some errors'}</h2>
                <ul>
                    {errorFields.map((field) => (
                        <li key={field.id}>
                            {labelFields.includes(field.type) &&
                                <label htmlFor={field.id}>{field.label}: <span>{field.errorText}</span></label>
                            }
                            {!labelFields.includes(field.type) &&
                                <strong>{field.label}: <span>{field.errorText}</span></strong>
                            }
                        </li>
                    ))}
                </ul>
            </div>
        );
    }
}

export default ErrorSummary;
