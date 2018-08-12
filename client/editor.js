
import 'styles/core.scss';

import React from 'react';
import { render } from 'react-dom';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import EditorScreen from 'editor/editor-screen';

const editor = () => {

	render(
		<Router>
			<Route path="/" component={EditorScreen} />
		</Router>
		,
		document.getElementById('app'),
	);
};

editor();
