
import './editor-screen.scss';

import React from 'react';

import Screen from '../components/screen';
import utils from 'utils';
import Editor from './editor';
import {formWithValidation, Field} from './form';
import Tooltip from '../components/tooltip';
import Modal from '../components/modal';
import {actionFieldConfig, stateFields} from './editor-screen-fields';
import TitleMenu from './title-menu';


class StateEditorScreen extends React.Component {

	constructor(props) {
		super(props);
		utils.bindThis(this, [
			'dataChange',
			'toggleTooltip',
			'handleFieldChange',
			'validateFields',
		]);

		this.state = {
			saving: undefined,
			isValidAll: true,
		};
		this.data = {};
		this.loadCallbacks = [];
		this.editor = new Editor(this.dataChange);
		this.props.formMethods.onFieldChange(this.handleFieldChange);
		this.props.formMethods.onValidityChange(isValidAll => {
			this.setState({isValidAll});
		});
	}

	componentWillUnmout() {
		clearTimeout(this.loadTimer);
	}

	handleFieldChange(fieldName, field) {
		if (this.props.formMethods.isValidAll(this.props.fields)) {
			const newState = {};

			switch (fieldName) {
				case 'positions': newState.positionsEditor = field.value; break;
				case 'startingMapItems': newState.startingMapItemsEditor = field.value; break;
				case 'startingQueueItems': newState.startingQueueItemsEditor = field.value; break;
			}

			this.setState({saving: true});
			this.editor.saveState(newState).then(() => {
				this.setState({saving: false});
			});
		}
	}

	dataChange(newData, callback) {
		const loadToState = () => {
			const posConfig = this.props.fields.positions.config;

			if (posConfig.newId < this.data.newPositionId) {
				posConfig.newId = this.data.newPositionId;
			}
			this.props.formMethods.updateFields({
				positions: this.data.positionsEditor,
				startingMapItems: this.data.startingMapItemsEditor,
				startingQueueItems: this.data.startingQueueItemsEditor,
			}, () => {
				this.loadInProgress = false;
				this.loadCallbacks.forEach(fn => fn());
				this.loadCallbacks = [];
			});
		};

		this.data = {...this.data, ...newData};
		for (let fieldName in this.props.fields) {
			if (this.props.fields[fieldName].type === 'multiAdd') {
				this.props.fields[fieldName].config.data = this.data;
			}
		}
		actionFieldConfig.data = this.data;
		if (callback) {
			this.loadCallbacks.push(callback);
		}

		clearTimeout(this.loadTimer);
		this.loadTimer = setTimeout(loadToState, 100);
	}

	toggleTooltip(type, isOpen) {
		this.setState({[`${type}Tooltip`]: isOpen});
	}

	validateFields(e) {
		e.preventDefault();
		this.setState({saving: this.state.saving || false}, () => {
			this.props.formMethods.validateAll(this.props.fields);
		});
	}

	render() {
		const {saving, isValidAll} = this.state;
		const {fields} = this.props;

		return (
			<Screen className="editor-screen">
				<form onSubmit={this.validateFields}>
					<input type="submit" className="access" tabindex="-1" />
					<div className="header">
						<div className="inner">
							<div className="row">
								<div className="col-30 col-l-20">
									<TitleMenu selected="state" />
								</div>
								<div className="col-70 col-l-50 event-select-col">
									{(saving !== undefined || !isValidAll) &&
										<Tooltip show={this.state.validateFieldsTooltip}
											toggleTooltip={isOpen => this.toggleTooltip('validateFields', isOpen)}>
											<button data-tooltip-trigger type="button" className="icon validate-fields" onClick={this.validateFields}>
												{!saving && isValidAll && <i className="done">done</i>}
												{!isValidAll && <i className="invalid">warning</i>}
												{saving && isValidAll && <i className="saving">sync</i>}
											</button>
											<p>
												{!isValidAll && 'Some fields are invalid. Changes cannot be saved.'}
												{saving && isValidAll && 'Saving.'}
												{saving === false && isValidAll && 'All changes saved.'}
											</p>
										</Tooltip>
									}
								</div>
							</div>
						</div>
					</div>
					<div className="form-content">
						<div className="inner">
							<div className="row">
								<div className="col-100">
									<Field config={fields.positions} />
								</div>
								<div className="col-100">
									<Field config={fields.startingMapItems} />
								</div>
								<div className="col-100">
									<Field config={fields.startingQueueItems} />
								</div>
							</div>
						</div>
					</div>
				</form>
			</Screen>
		);
	}
}

export default formWithValidation(StateEditorScreen, stateFields);
