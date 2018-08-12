
const express = require('express');
const path = require('path');
const fs = require('fs');

const iconsFolder = __dirname + '/static/images';
const dataJsonUrl = __dirname + '/client/game/data/data.json';

const app = express();

app.use('/static', express.static(path.resolve(__dirname, 'static')));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get('/', (req, resp) => {
	resp.sendFile(__dirname + '/static/index.html');
});

app.get('/editor', (req, resp) => {
	resp.sendFile(__dirname + '/static/editor.html');
});

app.get('/get-data', (req, resp) => {
	resp.send(getData());
});

app.post('/save-event', (req, resp) => {
	const eventName = Object.keys(req.body)[0];
	const event = req.body[eventName];
	let data = JSON.parse(fs.readFileSync(dataJsonUrl));

	data = {...data, events: {...data.events, [eventName]: event}};
	fs.writeFileSync(dataJsonUrl, JSON.stringify(data));
	resp.send({[eventName]: event});
});

const getData = () => {
	const dataFile = fs.readFileSync(dataJsonUrl);
	const data = JSON.parse(dataFile);

	data.icons = fs.readdirSync(iconsFolder).filter(name => name.includes('icon-')).map(name => name.match(/icon\-(.*?)\./)[1]);
	return data;
}


const server = app.listen(8081, 'localhost', () => {
	const host = server.address().address;
	const port = server.address().port;

	console.log(`Chronoguard app listening at http://${host}:${port}`);
});