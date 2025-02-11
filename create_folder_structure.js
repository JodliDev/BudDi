const {mkdirSync, existsSync} = require("node:fs");
const {resolve} = require('path');

const backendFolder = resolve(__dirname, "./", "dist", "backend");
if(!existsSync(backendFolder))
	mkdirSync(backendFolder, {recursive: true});

const frontendFolder = resolve(__dirname, "./", "dist", "frontend");
if(!existsSync(frontendFolder))
	mkdirSync(frontendFolder, {recursive: true});

const configFolder = resolve(__dirname, "./", "dist", "config");
if(!existsSync(configFolder))
	mkdirSync(configFolder, {recursive: true});
