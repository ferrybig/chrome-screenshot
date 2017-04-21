/* global Promise */

const CDP = require('chrome-remote-interface');
const fs = require('fs');

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

const debug = text => {
	return arg => {
		console.log(text, arg);
		return arg;
	};
};

const navigateToPage = (Page, url, timeout) => {
	return new Promise((resolve, reject) => {
		Page.loadEventFired(() => {
			resolve();
		});
		Page.navigate({ url: url });
		setTimeout(() => {
			reject('Timeout exceeded');
		}, timeout);
	});
};

const readFile = name => {};

const delay = time => {};

const screenshotLoop = client => {
	// Extract used DevTools domains.
	const { Page, Runtime, Emulation } = client;

	var hostname = 'slack.com';
	var url = 'https://' + hostname + '/';

	const errorHandler = err => {
		console.log('Errpr handler: ' + err);
		client.close();
	};
	console.log('Loading');
	debug('Testing debug')();
	try {
		Promise.all([Page.enable()])
			.then(debug('1'), errorHandler)
			.then(
				() =>
					Runtime.evaluate({
						expression: 'window.resizeTo(1280,800)'
					}),
				errorHandler
			)
			.then(debug('2'), errorHandler)
			.then(() => navigateToPage(Page, url, 10000), errorHandler)
			.then(debug('3'), errorHandler)
			.then(() => Page.captureScreenshot(), errorHandler)
			.then(debug('4'), errorHandler)
			.then(
				writeFile('images/' + hostname + '.png', 'base64'),
				errorHandler
			)
			.then(debug('5'), errorHandler)
			.then(() => {
				client.close();
				return true;
			}, errorHandler);
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
