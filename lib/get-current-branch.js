const cp = require('child-process-promise');

module.exports = async function getCurrentBranch() {
  const {stdout} = await cp.exec('git rev-parse --abbrev-ref HEAD');
  return stdout.toString().trim();
};
