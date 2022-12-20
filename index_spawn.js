const { default: axios } = require('axios');
const { spawn } = require('child_process');
const fse = require('fs-extra');
const controller = new AbortController();
const { signal } = controller;
const { dummyTasks: tasks, dummyTasks } = require('./dummy-input');

// async function fetchData(url) {}
// const getHtmlContent = (url) => {
// 	return new Promise((resolve, reject) => {
// 		setTimeout(() => {
// 			resolve(fetchData(url));
// 		}, 600);
// 	});
// };
const getHtmlContent = async (url) => {
	let response = await axios({ url: url, insecureHTTPParser: true });
	return response.data;
};

function createChildProcess(command, cb) {
	const [arg, ...options] = command.split(' ');
	const childProcess = spawn(arg, options);

	return childProcess;
}

function compileTask(task, cb) {
	for (let file of task.files) {
		fse.outputFileSync(file.path, file.content);
	}
	const childProcess = createChildProcess(tasks.command, cb);
	return childProcess;
}

async function processVersion(task, cb) {
	const id = task.id;
	let error = [];
	let html = null;
	let cli = [];
	const childProcess = await compileTask(task);
	childProcess.stdout.on('data', (data) => {
		// console.log(`stdout: ${data}`);
		cli.push(data.toString());
	});

	childProcess.stderr.on('data', (data) => {
		// console.error(`stderr: ${data}`);
		// const dataString = data.toString();
		// if (dataString.startsWith('error')) {
		// 	error.push(dataString);
		// }
		cli.push(data.toString());
	});

	childProcess.on('exit', (code) => {
		if (code) {
			console.error('Child was killed with code: ', code);
			error = code;
		} else if (signal) {
			console.error('Child was killed with signal', signal);
		} else {
			console.log('Child exited okay');
		}
	});
	const url = dummyTasks.results[0].url;
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve(
				createResultObj(id, html, error, cli, url, childProcess, task)
			);
		}, 1500);
	});
}

async function createResultObj(id, html, error, cli, url, child_process, task) {
	try {
		html = await getHtmlContent(url);
	} catch (err) {
		html = null;
	}
	for (let file of task.files) {
		fse.removeSync(file.path);
	}
	await child_process.kill();
	return { id, html, error, cli };
}
async function final(tasks) {
	const result = [];
	for (let i = 0; i < tasks.versions.length; i++) {
		const obj = await processVersion(tasks.versions[i]);
		result.push(obj);
		if (i === tasks.versions.length - 1) {
			fse.writeJsonSync('./result_in_json.json', result);
		}
	}
	console.log(result);
}
final(dummyTasks);
/* 
function processVersions(tasks) {
	const resultArr = [];
	for (let i = 0; i < tasks.versions.length; i++) {
		processVersion(tasks.versions[i], (result) => {
			resultArr.push(result);
			console.log(resultArr);
			// if (i === dummyTasks.length - 1) {
			// 	fse.writeJsonSync('./result_in_json.json', resultArr);
			// }
		});
	}
}

processVersions(dummyTasks); */
