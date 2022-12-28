const { processVersions } = require('./solution');
const { dummyTasks: inputData } = require('./dummy-input');
const fse = require('fs-extra');

const RESULT_PATH = './result_in_json.json';

async function getLog(inputData, path) {
	try {
		const { data } = await processVersions(inputData);
		await fse.writeJSON(path, data);
	} catch (err) {
		console.log(err);
	}
}

getLog(inputData, RESULT_PATH);
