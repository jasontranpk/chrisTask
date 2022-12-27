const { processVersions } = require('./solution');
const { dummyTasks: inputData } = require('./dummy-input');

processVersions(inputData, './result_in_json.json');
