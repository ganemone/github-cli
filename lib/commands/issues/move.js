const inquirer = require('inquirer');
const github = require('../../github.js');
const toPromptChoices = require('../../to-prompt-choices.js');
const selectProjectColumn = require('../../select-project-column.js');
const selectProjectCard = require('../../select-project-card.js');
exports.command = 'move';
exports.desc = 'Move a github issue between project columns';
exports.builder = {};
exports.handler = async function move(argv) {
  let {project, owner, repo, destination, card} = argv;
  if (!card) {
    card = await selectProjectCard({project, owner, repo});
  }
  if (!destination) {
    destination = await selectProjectColumn(project);
  }
  const resp = await github.projects.moveProjectCard({
    id: card.id,
    position: 'top',
    column_id: destination.id,
  });
  return {card, destination, resp};
};

