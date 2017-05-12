const inquirer = require('inquirer');
const github = require('../github.js');
const createIssue = require('./issues/create.js').handler;
const selectIssue = require('../select-issue.js');
const cp = require('child-process-promise');
const moveIssue = require('./issues/move.js').handler;

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

  const getIssue = issueConfig === 'existing'
    ? selectIssue(argv)
    : createIssue(argv);
  const issue = await getIssue;

  const branchName = `issue#${issue.number}`;
  console.log(`Checking out new branch ${branchName}...`);
  await cp.exec(`git checkout -b ${branchName}`);

  const columnsResponse = await github.projects.getProjectColumns({
    project_id: project,
  });

  const progressColumn = columnsResponse.data.find((item) => {
    return item.name.toLowerCase().includes('progress');
  });

  if (!progressColumn) {
    console.warn('Couldn\'t find a project column for "In Progress". Leaving issue where it is');
    return;
  }
  await moveIssue(Object.assign({}, argv, {
    issue,
    destination: progressColumn,
  }));
};
