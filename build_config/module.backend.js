const path = require("path");
const nodeExternals = require("webpack-node-externals");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
	optimization: {
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					keep_classnames: true, //we are using "reflection" to find message and database classes
				},
			})
		]
	},
	entry: {
		backend: './src/backend/ts/index.ts'
	},
	resolve: {
		extensions: [".ts", ".js"],
	},
	output: {
		clean: true,
		path: path.join(__dirname, '../dist/backend'),
		publicPath: '/dist/',
		// filename: '[name].[contenthash].js',
		filename: 'backend.js',
	},
	
	module: {
		// unknownContextCritical : false,
		rules: [
			{
				test: /\.ts$/,
				exclude: [/node_modules/],
				loader: 'ts-loader'
			},
			// {
			// 	test: /\.m?js/,
			// 	resolve: {
			// 		fullySpecified: false
			// 	}
			// }
			
			// {
			// 	test: /\.js/,
			// 	exclude: [/node_modules/],
			// }
		]
	},
	target: 'node',
	// externals: {
	// 	ws: 'ws',
	// 	'better-sqlite3': 'sqlite3'
	// }
	externals: [nodeExternals()]
	// other loaders, plugins etc. specific for backend
};
