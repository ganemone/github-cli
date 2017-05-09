const path = require('path');
const fs = require('fs');
const filename = '.gitcliconfig';

module.exports.load = function loadConfigFile() {
  let globalConfigFile = path.join(process.env.HOME, filename);
  let globalConfig;
  try {
    globalConfig = JSON.parse(fs.readFileSync(globalConfigFile).toString());
  } catch (e) {}

  let currentPath = process.cwd();
  let configFile;
  while (currentPath !== '/' && !configFile) {
    const currentConfigPath = path.join(currentPath, filename);
    try {
      if (fs.existsSync(currentConfigPath)) {
        configFile = currentConfigPath;
      }
    } catch (e) {
    } finally {
      currentPath = path.dirname(currentPath);
    }
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
};

module.exports.write = function writeConfigFile(data) {
  const destPath = path.join(process.cwd(), filename);
  const destGlobalPath = path.join(process.env.HOME, filename);
  const {token} = data;
  const localConfig = Object.assign({}, data);
  delete localConfig.token;
  fs.writeFileSync(destPath, JSON.stringify(localConfig, null, 2));
  fs.writeFileSync(destGlobalPath, JSON.stringify({token}, null, 2));
  return [destPath, destGlobalPath];
};
