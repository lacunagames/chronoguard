
const express = require('express');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');

const assetPaths = {
	icons: __dirname + '/static/icons',
	mapImages: __dirname + '/static/map-images',
	mapVideos: __dirname + '/static/map-videos',
	soundMusic: __dirname + '/static/sound-music',
	soundEffects: __dirname + '/static/sound-effects',
};
const dataJsonUrl = __dirname + '/client/game/data/data.json';
const backupFolder = __dirname + '/client/game/data-backup/';

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
	const dataFile = fs.readFileSync(dataJsonUrl);
	const data = JSON.parse(dataFile);

	for (let folderType in assetPaths) {
		data[folderType] = fs.readdirSync(assetPaths[folderType]).map(name => name.slice(0, name.lastIndexOf('.')));
	}

	resp.send(data);
});

app.post('/save-event', (req, resp) => {
	backupData();
	const eventName = Object.keys(req.body)[0];
	const event = req.body[eventName];
	let data = JSON.parse(fs.readFileSync(dataJsonUrl));
	const isNewEvent = !data.events[eventName];

	data = {
		...data,
		events: {...data.events, [eventName]: event},
		newEventId: isNewEvent ? data.newEventId + 1 : data.newEventId,
	};
	fs.writeFileSync(dataJsonUrl, JSON.stringify(data, null, 2));
	resp.send({[eventName]: event});
});

app.get('/remove-event', (req, resp) => {
	const eventName = req.query.type;
	let data = JSON.parse(fs.readFileSync(dataJsonUrl));

	delete data.events[eventName];
	fs.writeFileSync(dataJsonUrl, JSON.stringify(data, null, 2));
	resp.send({message: 'Successfully removed event', eventName});
});


let watcherTimer;
const updateAssetList = path => {
	clearTimeout(watcherTimer);
	watcherTimer = setTimeout(() => {
		const dataFile = fs.readFileSync(dataJsonUrl);
		const data = JSON.parse(dataFile);

		for (let folderType in assetPaths) {
			data[folderType] = fs.readdirSync(assetPaths[folderType]).map(name => name.slice(0, name.lastIndexOf('.')));
		}
		fs.writeFileSync(dataJsonUrl, JSON.stringify(data, null, 2));
	}, 500);
};

const assetPathArr = Object.keys(assetPaths).map(name => assetPaths[name].replace(__dirname + '/', ''));
const watcher = chokidar.watch(assetPathArr, {ignore: /^\./, persistent: true});

watcher.on('add', updateAssetList).on('change', updateAssetList).on('unlink', updateAssetList);


const backupData = () => {
		const twoDigit = val => val < 10 ? '0' + val : val;
		const now = new Date();
		const threeDays = 3 * 24 * 60 * 60 * 1000;
		const targetPath = backupFolder +
						`data--${now.getFullYear()}-${twoDigit(now.getMonth() + 1)}-${twoDigit(now.getDate())}--` +
						`${twoDigit(now.getHours())}-${twoDigit(now.getMinutes())}-${twoDigit(now.getSeconds())}.json`;

	const backupFiles = fs.readdirSync(backupFolder)
													.filter(name => name.includes('.json') && name.split('--').length === 3)
													.map(name => {
														const [, date, time] = name.slice(0, name.indexOf('.json')).split('--');

														return {name, day: new Date(`${date}Z`), time: new Date(`${date}T${time.replace(/\-/g, ':')}Z`)};
													})
													.sort((a, b) => b.time - a.time);

	const deleteFiles = backupFiles.filter((fileObj, index) => {
		const isOldFile = index > 0 && backupFiles[index - 1].day.getTime() === fileObj.day.getTime();

		return fileObj.time < now - threeDays && isOldFile;
	});
	deleteFiles.forEach(fileObj => fs.unlinkSync(backupFolder + fileObj.name));
	deleteFiles.length && console.log(`${deleteFiles.length} backup files have been deleted.`);

	if (fs.readFileSync(dataJsonUrl).toString() !== fs.readFileSync(backupFolder + backupFiles[0].name).toString()) {
		fs.createReadStream(dataJsonUrl).pipe(fs.createWriteStream(targetPath));
	}
};


const server = app.listen(8081, 'localhost', () => {
	const host = server.address().address;
	const port = server.address().port;

	console.log(`Chronoguard app listening at http://${host}:${port}`);
});