const inquirer = require('inquirer');
const github = require('./github.js');
const toPromptChoices = require('./to-prompt-choices.js');

module.exports = async function selectProjectColumn(project) {
  const columnsResponse = await github.projects.getProjectColumns({
    project_id: project,
  });
  const choices = columnsResponse.data.map(toPromptChoices);
  const {column} = await inquirer.prompt({
    type: 'list',
    name: 'column',
    message: 'Select a column',
    choices: choices,
  });
  return column;
};
