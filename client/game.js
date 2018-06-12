import React from 'react';
import { render } from 'react-dom';
import { BrowserRouter as Router, Route } from 'react-router-dom';

const app = () => {

	render(
			<Router>
				<div>
					<h1>Hey!</h1>
				{/*
					<Route path="/" component={OnlineServicesPage} />
					<Route exact path='/moderation/ui/add-business' component={ListPage} />
				*/}
				</div>
			</Router>
		,
		document.getElementById('game'),
	);
};

export default app;
