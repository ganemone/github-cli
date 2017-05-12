const inquirer = require('inquirer');
const github = require('../../github.js');
const toPromptChoices = require('../../to-prompt-choices.js');
const selectProjectColumn = require('../../select-project-column.js');
const selectIssue = require('../../select-issue.js');

exports.command = 'move';
exports.desc = 'Move a github issue between project columns';
exports.builder = {};
// TODO: Add label matching column name
exports.handler = async function move(argv) {
  let {project, owner, repo, destination, issue} = argv;
  if (!issue) {
    issue = await selectIssue({project, owner, repo});
  }
  if (!destination) {
    destination = await selectProjectColumn(project);
  }
  const resp = await github.projects.moveProjectCard({
    id: issue.card.id,
    position: 'top',
    column_id: destination.id,
  });
  return {issue, destination, resp};
};

