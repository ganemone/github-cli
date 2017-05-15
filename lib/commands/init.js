const inquirer = require('inquirer');
const cp = require('child_process');
const config = require('../config.js');
const github = require('../github.js');
const genOAuth = require('../genoauth.js');
exports.command = 'init';
exports.desc = 'initialize configuration for project';
exports.builder = argv => argv;
exports.handler = async function initcmd(/* argv */) {
  cp.exec('git remote -v', async (err, stdout) => {
    if (err) throw err;
    const remotes = stdout
      .toString()
      .split('\n')
      .filter(i => i.length)
      .map(remote => {
        const [name, rest] = remote.split('\t');
        const [ref, type] = rest.split(' ');
        return {name, ref, type};
      })
      .filter((item, index, list) => {
        return list.map(i => i.ref).indexOf(item.ref) === index;
      });
    // TODO: Support multiple git origins
    if (remotes.length > 1) {
      throw new Error('Multiple git origins not supported yet');
    } else if (remotes.length === 0) {
      throw new Error('No git origins found');
    }
    const {ref} = remotes[0];
    const refRegex = /git@.*?:(.*?)\/(.*?)\.git$/;
    const matches = refRegex.exec(ref);
    // TODO: Prompt user for repo if we can't parse it
    if (!matches) {
      throw new Error(`Could not parse remote ref: ${ref}`);
    }
    // eslint-disable-next-line no-unused-vars
    const [_, owner, repo] = matches;
    const existingConfig = config.load();
    let token = existingConfig && existingConfig.token;
    let username = existingConfig && existingConfig.username;

    if (!username) {
      const usernameResult = await inquirer.prompt({
        name: 'username',
        message: 'Github username: ',
        type: 'input',
      });
      username = usernameResult.username;
    }
    if (!token) {

      // Prompt for password
      const passResult = await inquirer.prompt({
        name: 'password',
        message: 'Github password (not stored by application!): ',
        type: 'password',
      });
      const password = passResult.password;

      try {
        // TODO: if personal token exists, update instead of create.
        token = await genOAuth(username, password);
      } catch (e) {
        throw new Error(JSON.stringify(e));
      }
    }
    github.authenticate({
      type: 'token',
      token,
    });
    const response = await github.projects.getRepoProjects({
      owner,
      repo,
    });
    if (!response || !response.data) {
      throw new Error('Error loading projects');
    }
    const projects = response.data;
    if (projects.length > 1) {
      // TODO: prompt for user to pick project
      throw new Error('Multiple projects not supported yet');
    } else if (projects.length === 0) {
      throw new Error('Could not find any projects');
    }
    const project = projects[0];
    const files = await config.write({
      project: project.id,
      username,
      token,
      owner,
      repo,
    });
    console.log(`Config initialized into: ${files.join(' and ')}`);
  });
};
