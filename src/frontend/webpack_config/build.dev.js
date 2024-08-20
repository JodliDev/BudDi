const frontend = require("./module.frontend");

module.exports = [
	{
		mode: "development",
		devtool: "inline-source-map",
		...frontend
	}
];
