const config = require('../config.js');
const github = require('../github.js');
const inquirer = require('inquirer');
const autocomplete = require('../autocomplete.js');

exports.command = 'set-default-reviewers';
exports.desc = 'Set default reviewers for the current repo';
exports.builder = argv => argv;
exports.handler = async function setDefaultReviewers(argv) {
  const {owner, repo} = argv;
  const collaboratorsResponse = await github.repos.getCollaborators({
    owner,
    repo,
  });
  const users = collaboratorsResponse.data;
  let choices = users.map(u => {
    return {
      name: u.login,
      value: u.login,
    };
  });
  const reviewers = [];
  async function addReviewer() {
    const {user} = await autocomplete(choices, {
      name: 'user',
      message: 'Add a default reviewer',
    });
    choices = choices.filter(c => {
      return c !== user;
    });
    reviewers.push(user);
  }

  let shouldAsk = true;
  while (shouldAsk) {
    await addReviewer();
    const {shouldContinue} = await inquirer.prompt({
      name: 'shouldContinue',
      type: 'confirm',
      message: 'Add another reviewer?',
    });
    shouldAsk = shouldContinue;
  }
  const loadedConfig = config.load();
  loadedConfig.defaultReviewers = reviewers;
  config.write(loadedConfig);
  console.log('Added default reviewers: ', reviewers);
};
