
import 'styles/core.scss';

import React from 'react';
import { render } from 'react-dom';
import { BrowserRouter as Router, Route } from 'react-router-dom';

import WorldScreen from 'components/world-screen';

const app = () => {

	render(
		<Router>
			<Route path="/" component={WorldScreen} />
		</Router>
		,
		document.getElementById('app'),
	);
};

export default app;
