const frontend = require("../src/frontend/webpack_config/module.frontend");
const backend = require("./module.backend");

module.exports = [
	{
		mode: "production",
		devtool: "source-map",
		...frontend
	},
	{
		mode: "production",
		devtool: "source-map",
		...backend
	}
];
