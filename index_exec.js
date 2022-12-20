const { default: axios } = require('axios');
const { exec } = require('child_process');
const fse = require('fs-extra');
const controller = new AbortController();
const { signal } = controller;
const { dummyTasks: tasks, dummyTasks } = require('./dummy-input');

async function fetchData(url) {
	let response = await axios({ url: url, insecureHTTPParser: true });
	return response.data;
}
const getHtmlContent = (url) => {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve(fetchData(url));
		}, 600);
	});
};

function createChildProcess(command, cb) {
	const childProcess = exec(command, { signal }, (error, stdout, stderr) => {
		if (error) {
			console.log(`error: ${error.message}`);
			cb({ error: error.message });
			return;
		}
		if (stderr) {
			cb({ stderr });
			console.log(`std error: ${stderr}`);
		}
		console.log(`stdout: ${stdout}`);
		cb({ stdout });
	});
	return childProcess;
}

async function compileTask(task, cb) {
	for (let file of task.files) {
		await fse.outputFile(file.path, file.content);
	}
	const childProcess = createChildProcess(tasks.command, cb);
	return childProcess;
}

async function processVersion(task, nth, cb) {
	let error = null;
	let html = null;
	let cli = [];
	compileTask(task, async (data) => {
		console.log(data);
		if (data.error) {
			error = data.error;
		}
		if (data.stderr) {
			cli.push(data.stderr);
		}
		if (data.stdout) {
			cli.push(data.stdout);
		}
		console.log('error', error);
		if (!error) {
			const url = tasks.results[nth].url;
			html = await getHtmlContent(url);
		}
		const result = { id: task.id, html, error, cli };
		cb(result);
		// controller.abort();
	});
	// controller.abort();
}

function processVersions(tasks) {
	const resultArr = [];
	for (let i = 0; i < tasks.versions.length; i++) {
		processVersion(tasks.versions[i], i, (result) => {
			resultArr.push(result);
			console.log(resultArr);
			// if (i === dummyTasks.length - 1) {
			// 	fse.writeJsonSync('./result_in_json.json', resultArr);
			// }
		});
	}
}

processVersions(dummyTasks);
