const frontend = require("./module.fronted");
const backend = require("./module.backend");

module.exports = [
	{
		mode: "development",
		devtool: "inline-source-map",
		...frontend
	},
	{
		mode: "development",
		devtool: "inline-source-map",
		...backend
	}
];
