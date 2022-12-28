const { default: axios } = require('axios');
const { spawn } = require('child_process');
const fse = require('fs-extra');
const controller = new AbortController();
const { signal } = controller;

const getHtmlContent = async (url) => {
	let response = await axios({ url: url, insecureHTTPParser: true });
	return response.data;
};

function createChildProcess(command) {
	const [arg, ...options] = command.split(' ');
	const childProcess = spawn(arg, options);
	return childProcess;
}

function compileTask(task, command) {
	for (let file of task.files) {
		fse.outputFileSync(file.path, file.content);
	}
	const childProcess = createChildProcess(command);
	return childProcess;
}

async function clearProcess(task, childProcess) {
	for (let file of task.files) {
		fse.removeSync(file.path);
	}
	await childProcess.kill();
}

async function processVersion(task, url, command) {
	return new Promise((resolve, reject) => {
		const resultObject = {
			id: task.id,
			error: null,
			html: null,
			cli: [],
		};

		const childProcess = compileTask(task, command);

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
				await clearProcess(task, childProcess);
				resolve(resultObject);
			}
		});
	});
}

module.exports.processVersions = async function (tasks) {
	const command = tasks.command;
	const url = tasks.results[0].url;
	const results = {
		data: [],
	};
	for (let i = 0; i < tasks.versions.length; i++) {
		const obj = await processVersion(tasks.versions[i], url, command);
		results.data.push(obj);
	}
	console.log(results);
	return results;
};
