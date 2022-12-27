const { processVersions } = require('./solution');
const { dummyTasks: inputData } = require('./dummy-input');
const fse = require('fs-extra');

const RESULT_PATH = './result_in_json.json';

processVersions(inputData)
	.then((result) => {
		console.log(result);
		fse.writeJSONSync(RESULT_PATH, result.data);
	})
	.catch((err) => console.log(err));
