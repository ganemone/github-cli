const inquirer = require('inquirer');
const cp = require('child_process');
const config = require('../lib/config.js');
const github = require('../lib/github.js');
exports.command = 'init';
exports.desc = 'Initialize configuration for project';
exports.builder = {};
exports.handler = function initCmd(argv) {
  cp.exec('git remote -v', (err, stdout) => {
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
    const [_, owner, repo] = matches;
    const existingConfig = config.load();
    let token = existingConfig && existingConfig.token;
    // TODO: Figure out how to automatically generate these tokens
    inquirer
      .prompt([
        {
          name: 'token',
          message: 'Generate a personal access token here: https://github.com/settings/tokens: ',
          type: 'input',
          when: () => !token,
        },
      ])
      .then((answers) => {
        token = token || answers.token;
        github.authenticate({
          type: 'token',
          token,
        });
        return github.projects.getRepoProjects({
          owner,
          repo,
        });
      })
      .then(response => {
        if (!response || !response.data) {
          throw new Error('Error loading projects');
        }
        const projects = response.data;
        if (projects.length > 1) {
          // TODO: prompt for user to pick project
          throw new Error('Multiple projects not supported yet');
        } else if (projects.length === 0) {
          throw new Error('Could not find any projects');
        } else {
          const project = projects[0];
          return project;
        }
      })
      .then(project => {
        return config.write({
          project: project.id,
          token,
          owner,
          repo,
        });
      }).then((files) => {
        console.log(`Config initialized into: ${files.join(' and ')}`);
      });
  });
};
