
import 'styles/core.scss';

import React from 'react';
import { render } from 'react-dom';
import { BrowserRouter as Router, Route, Redirect } from 'react-router-dom';

import EventEditorScreen from 'editor/event-editor-screen';
import StateEditorScreen from 'editor/state-editor-screen';
import ConditionEditorScreen from 'editor/condition-editor-screen';

const editor = () => {

	render(
		<Router>
			<React.Fragment>
				<Route path="/editor" render={() => (<Redirect to="/event-editor" />)} />
				<Route path="/event-editor" component={EventEditorScreen} />
				<Route path="/state-editor" component={StateEditorScreen} />
				<Route path="/condition-editor" component={ConditionEditorScreen} />
			</React.Fragment>
		</Router>
		,
		document.getElementById('app'),
	);
};

editor();
