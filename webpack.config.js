var webpack = require('webpack');

module.exports = {
	entry: {
		'build': __dirname + '/src/Export.js'
	},
	output: {
		path: __dirname + '/dist/',
		filename: '[name].js'
	},
	plugins: [
		new webpack.optimize.OccurenceOrderPlugin()
	],
	resolve: {
		modulesDirectories: [],
		extensions: ['', '.js']
	},
	externals: {
		'window': 'window',
		'queue': 'queue',
		'$': 'jQuery'
	}
};