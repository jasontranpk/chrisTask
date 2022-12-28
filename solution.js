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
	if (!html) {
		try {
			html = await getHtmlContent(url);
		} catch (err) {
			html = null;
		}
	}

	for (let file of task.files) {
		fse.removeSync(file.path);
	}
	await childProcess.kill();
	return { id, html, error, cli };
}

async function processVersion(task, cb) {
	const id = task.id;
	let error = null;
	let html = null;
	let cli = [];
	const url = inputData.results[0].url;
	const childProcess = compileTask(task);

	childProcess.stdout.on('data', (data) => {
		console.log(data);
		cli.push(data.toString());
	});

	childProcess.stderr.on('data', async (data) => {
		let htmlContent = null;
		console.log(data.toString());
		cli.push(data.toString());
		try {
			htmlContent = await getHtmlContent(url);
		} catch (error) {
			// console.log('cant get html content yet');
		}
		if (htmlContent) {
			const result = await createResultObj(
				id,
				htmlContent,
				error,
				cli,
				url,
				childProcess,
				task
			);
			cb(result);
		}
	});

	childProcess.on('exit', async (code) => {
		if (code) {
			console.error('Child was killed with error code: ', code);
			error = code;
			const result = await createResultObj(
				id,
				html,
				error,
				cli,
				url,
				childProcess,
				task
			);
			cb(result);
		} else if (signal) {
			console.error('Child was killed with signal', signal);
		} else {
			console.log('Child exited okay');
		}
	});
}

module.exports.processVersions = async function (tasks, cb) {
	const result = {
		data: [],
	};
	for (let i = 0; i < tasks.versions.length; i++) {
		const obj = await processVersion(tasks.versions[i], (resultObj) => {
			console.log(resultObj);
			result.data.push(resultObj);
		});
	}
	return result;
};
