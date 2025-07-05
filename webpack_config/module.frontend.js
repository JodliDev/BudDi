const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require('terser-webpack-plugin');
const FaviconsWebpackPlugin = require("favicons-webpack-plugin");

module.exports = {
	optimization: {
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					keep_classnames: true, //we are using "reflection" to find message and page classes
				},
			})
		]
	},
	entry: {
		frontend: path.join(__dirname, '../src/frontend/ts/index.ts')
	},
	resolve: {
		extensions: [".ts", ".tsx", ".js"],
	},
	output: {
		path: path.join(__dirname, '../dist/frontend'),
		clean: true,
		filename: '[name].[contenthash].js',
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: path.join(__dirname, '../src/frontend/index.html'),
		}),
		new MiniCssExtractPlugin({
			filename: '[name].[contenthash].css',
		}),
		
		new FaviconsWebpackPlugin( {
			logo: path.join(__dirname, '../images/logo.svg'),
			cache: true,
			favicons: {
				icons: {
					android: false,
					appleIcon: false,
					appleStartup: false,
					favicons: true,
					windows: false,
					yandex: false,
				}
			}
		}),
	],
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				exclude: [/node_modules/],
				loader: 'ts-loader'
			},
			{
				test: /\.(png|ico)$/,
				type: "asset/inline",
			},
			{
				test: /\.(css)$/,
				use: [MiniCssExtractPlugin.loader, 'css-loader']
			},
			{
				test: /\.html$/,
				exclude: /main.html/,
				loader: "html-loader"
			},
			{
				test: /\.svg$/,
				oneOf: [
					{ //use an inline svg
						// use: 'raw-loader',
						type: "asset/source"
					}
				],
			},
		]
	}
};
