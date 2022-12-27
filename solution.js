const { default: axios } = require('axios');
const { spawn } = require('child_process');
const fse = require('fs-extra');
const controller = new AbortController();
const { signal } = controller;
const { dummyTasks: inputData } = require('./dummy-input');

const getHtmlContent = async (url) => {
	let response = await axios({ url: url, insecureHTTPParser: true });
	return response.data;
};

function createChildProcess(command) {
	const [arg, ...options] = command.split(' ');
	const childProcess = spawn(arg, options);
	return childProcess;
}

function compileTask(task) {
	for (let file of task.files) {
		fse.outputFileSync(file.path, file.content);
	}
	const childProcess = createChildProcess(inputData.command);
	return childProcess;
}

async function createResultObj(id, html, error, cli, url, childProcess, task) {
	try {
		html = await getHtmlContent(url);
	} catch (err) {
		html = null;
	}
	for (let file of task.files) {
		fse.removeSync(file.path);
	}
	await childProcess.kill();
	return { id, html, error, cli };
}

async function processVersion(task) {
	const id = task.id;
	let error = null;
	let html = null;
	let cli = [];
	const childProcess = compileTask(task);

	childProcess.stdout.on('data', (data) => {
		cli.push(data.toString());
	});

	childProcess.stderr.on('data', (data) => {
		cli.push(data.toString());
	});

	childProcess.on('exit', (code) => {
		if (code) {
			console.error('Child was killed with error code: ', code);
			error = code;
		} else if (signal) {
			console.error('Child was killed with signal', signal);
		} else {
			console.log('Child exited okay');
		}
	});
	const url = inputData.results[0].url;
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve(
				createResultObj(id, html, error, cli, url, childProcess, task)
			);
		}, 1500);
	});
}

module.exports.processVersions = async function (tasks) {
	const result = {
		error: null,
		data: [],
	};
	for (let i = 0; i < tasks.versions.length; i++) {
		try {
			const obj = await processVersion(tasks.versions[i]);
			result.data.push(obj);
		} catch (err) {
			result.error = 'Something wrong! Please try again later';
			return result;
		}
	}
	return result;
};
