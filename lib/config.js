const assert = require('assert');
const path = require('path');
const fs = require('fs');
const filename = '.gitcliconfig';

function load() {
  let globalConfigFile = path.join(process.env.HOME, filename);
  let globalConfig;
  try {
    globalConfig = JSON.parse(fs.readFileSync(globalConfigFile).toString());
  } catch (e) {
    console.warn(`WARNING: Invalid configuration found at ${globalConfigFile}`);
  }

  let currentPath = process.cwd();
  let configFile;
  while (currentPath !== '/' && !configFile) {
    const currentConfigPath = path.join(currentPath, filename);
    if (fs.existsSync(currentConfigPath)) {
      configFile = currentConfigPath;
    }
    currentPath = path.dirname(currentPath);
  }
  if (configFile) {
    try {
      return Object.assign(
        globalConfig || {},
        JSON.parse(fs.readFileSync(configFile).toString())
      );
    } catch (e) {
      console.error(`Invalid config file at path: ${configFile}`, e);
      return globalConfig;
    }
  }
}

function loadStrict() {
  const sharedMessage = 'please call gitcli init';
  const config = load();
  assert.ok(config.token, `access token required - ${sharedMessage}`);
  assert.ok(config.project, `project config required - ${sharedMessage}`);
  assert.ok(config.username, `username config required - ${sharedMessage}`);
  assert.ok(config.repo, `repo config required - ${sharedMessage}`);
  assert.ok(config.owner, `owner config required - ${sharedMessage}`);
  return config;
}

function write(data) {
  const destPath = path.join(process.cwd(), filename);
  const destGlobalPath = path.join(process.env.HOME, filename);
  const {token, username} = data;
  const localConfig = Object.assign({}, data);
  delete localConfig.token;
  delete localConfig.username;
  fs.writeFileSync(destPath, JSON.stringify(localConfig, null, 2));
  fs.writeFileSync(destGlobalPath, JSON.stringify({token, username}, null, 2));
  return [destPath, destGlobalPath];
}

module.exports.load = load;
module.exports.loadStrict = loadStrict;
module.exports.write = write;
