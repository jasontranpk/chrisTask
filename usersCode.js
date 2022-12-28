const { processVersions } = require('./solution');
const { dummyTasks: inputData } = require('./dummy-input');
const fse = require('fs-extra');

const RESULT_PATH = './result_in_json.json';

async function getLog(inputData, path) {
	const { data } = await processVersions(inputData);
	await fse.writeJSON(path, data);
}

getLog(inputData, RESULT_PATH);
