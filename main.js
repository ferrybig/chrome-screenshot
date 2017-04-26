/* global Promise */
'use strict';

const CDP = require('chrome-remote-interface');
const fs = require('fs');
const prompt = require('prompt');

const writeFile = (name, encoding) => {
	return result =>
		new Promise((resolve, reject) =>
			fs.writeFile(
				name,
				result.data,
				encoding,
				err => (err ? reject(err) : resolve(true))
			)
		);
};

const debug = (text, simple) => arg => {
	if (!simple) console.log(text, arg);
	else console.log(text);
	return arg;
};

const navigateToPage = (Page, url, timeout) => {
	return new Promise((resolve, reject) => {
		let task = setTimeout(() => {
			reject('Timeout exceeded');
		}, timeout);
		Page.loadEventFired(() => {
			resolve();
			clearTimeout(task);
		});
		Page.navigate({ url: url });
	});
};

const readFile = name => {};

const delay = time => {};

const errorCallback = cb => error => {
	console.log('Error detected: ', error);
	cb();
};

const askPrompt = name => {
	return new Promise((resolv, reject) => {
		prompt.get([name], function(err, result) {
			if (err) {
				return reject(err);
			}
			resolv(result[name]);
		});
	});
};

const screenshot = (Runtime, Page, errorHandler) => val => {
	const split = val.split(' ');
	const url = split[0];
	let safeFile;
	if (split.length === 1) {
		safeFile = 'images/' + url.replace(/[^a-z0-9.\[\]]/g, '') + '.png';
	} else {
		safeFile = split[0];
	}
	return new Promise((resolv, reject) =>
		new Promise(resolv => {
			console.log('Capturing ' + url + ' to ' + safeFile);
			resolv();
		})
			.then(
				() =>
					Runtime.evaluate({
						expression: 'window.resizeTo(1280,800)'
					}),
				errorCallback(resolv)
			)
			//.then(debug('2'), errorHandler)
			.then(() => navigateToPage(Page, url, 10000), errorCallback(resolv))
			//.then(debug('3'), errorHandler)
			.then(() => Page.captureScreenshot(), errorCallback(resolv))
			//.then(debug('4'), errorHandler)
			.then(writeFile(safeFile, 'base64'), errorCallback(resolv))
			.then(debug('Captured ' + url, true), errorHandler)
			.then(resolv)
	);
};

const screenshotLoop = client => {
	// Extract used DevTools domains.
	const { Page, Runtime, Emulation } = client;

	const errorHandler = err => {
		console.log('Error: ' + err);
		client.close();
	};
	prompt.start();

	console.log('Loading');
	try {
		let prom = Promise.all([Page.enable()]);

		var args = process.argv.slice(2);
		if (args.length === 0) {
			prom = prom
				.then(() => askPrompt('Website'))
				.then(screenshot(Runtime, Page, errorHandler));
		} else {
			args.forEach(function(val) {
				prom = prom
					.then(() => val)
					.then(screenshot(Runtime, Page, errorHandler));
				//.then(debug('Captured!'));
			});
		}

		prom
			.then(debug('Closing connection...', true))
			.then(() => {
				client.close();
				return true;
			}, errorHandler)
			.then(() => {
				prompt.stop();
				console.log('done');
			});
	} catch (err) {
		errorHandler(err);
	}
};

CDP(
	{
		host: '127.0.0.1',
		port: 9222
	},
	screenshotLoop
).on('error', err => {
	console.error('Cannot connect to browser:', err);
});
