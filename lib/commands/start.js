const inquirer = require('inquirer');
const github = require('../github.js');
const createIssue = require('./issues/create.js').handler;
const selectIssue = require('../select-issue.js');
const cp = require('child-process-promise');

exports.command = 'start';
exports.desc = 'Start work on an issue';
exports.builder = argv => argv;
exports.handler = async function start(argv) {
  const {username, repo, owner, project} = argv;
  const {issueConfig} = await inquirer.prompt({
    type: 'list',
    message: 'Create new issue or use existing?',
    choices: [
      {
        name: 'Create new issue',
        value: 'new',
      },
      {
        name: 'Use existing issue',
        value: 'existing',
      },
    ],
    name: 'issueConfig',
  });

  const getIssue = issueConfig === 'existing' ? selectIssue(argv) : createIssue(argv);
  const issue = await getIssue;

  await cp.exec(`git checkout -b issue#${issue.number}`);
};

