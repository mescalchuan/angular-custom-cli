var path = require('path');
var webpack = require('webpack');
var DllPlugin = webpack.DllPlugin;

module.exports = {
	entry: {
		angular: ['angular']
	},
	output: {
		filename: '[name].dll.js',
		path: path.resolve(__dirname, 'entry'),
		library: '[name]_dll'
	},
	plugins: [
		new DllPlugin({
			name: '[name]_dll',
			path: path.join(__dirname, 'entry', '[name].manifest.json')
		})
	]
}

