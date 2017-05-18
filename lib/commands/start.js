const inquirer = require('inquirer');
const createIssue = require('./issues/create.js').handler;
const selectIssue = require('../select-issue.js');
const cp = require('child-process-promise');
const moveIssue = require('./issues/move.js').handler;

exports.command = 'start';
exports.desc = 'Start work on an issue';
exports.builder = argv => argv;
exports.handler = async function start(argv) {
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

  const getIssue = issueConfig === 'existing'
    ? selectIssue(argv)
    : createIssue(Object.assign({destination: 'progress'}, argv));
  const issue = await getIssue;

  const branchName = `issue#${issue.number}`;
  console.log(`Checking out new branch ${branchName}...`);
  await cp.exec(`git checkout -b ${branchName}`);

  if (issueConfig === 'existing') {
    await moveIssue(
      Object.assign({}, argv, {
        issue,
        destination: 'progress',
      })
    );
  }
};
