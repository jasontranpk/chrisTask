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

async function clearProcess(task, childProcess) {
	for (let file of task.files) {
		fse.removeSync(file.path);
	}
	await childProcess.kill();
}

async function processVersion(task) {
	return new Promise((resolve, reject) => {
		const resultObject = {
			id: task.id,
			error: null,
			html: null,
			cli: [],
		};
		const url = inputData.results[0].url;
		const childProcess = compileTask(task);

		childProcess.stderr.on('data', async (data) => {
			let htmlContent = null;
			resultObject.cli.push(data.toString());
			try {
				htmlContent = await getHtmlContent(url);
			} catch (error) {
				// console.log('html is not yet to be rendered');
			}
			if (htmlContent) {
				resultObject.html = htmlContent;
				await clearProcess(task, childProcess);
				resolve(resultObject);
			}
		});

		childProcess.on('exit', async (code) => {
			if (code) {
				console.error('Child was killed with error code: ', code);
				resultObject.error = code;
				await clearProcess(task, childProcess);
				resolve(resultObject);
			} else if (signal) {
				console.error('Child was killed with signal', signal);
			} else {
				console.log('Child exited okay');
			}
		});
	});
}

module.exports.processVersions = async function (tasks) {
	const result = {
		data: [],
	};
	for (let i = 0; i < tasks.versions.length; i++) {
		const obj = await processVersion(tasks.versions[i]);
		result.data.push(obj);
	}
	console.log(result);
	return result;
};
