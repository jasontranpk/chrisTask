const { processVersions } = require('./solution');
const { dummyTasks: inputData } = require('./dummy-input');
const fse = require('fs-extra');

const { data, error } = processVersions(inputData);

if (!error) {
	fse.writeJSONSync(data);
} else {
	console.log(error);
}
