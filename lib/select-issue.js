const github = require('./github.js');
const fuzzy = require('fuzzy');
const inquirer = require('inquirer');

module.exports = async function selectIssue(options) {
  const {repo, owner} = options;
  const issuesResponse = await github.issues.getForRepo({
    repo,
    owner,
  });
  if (!issuesResponse.data) {
    throw new Error('Failed to load issues');
  }

  const issues = issuesResponse.data.map(i => {
    return {
      name: i.title,
      value: i,
    };
  });
  const issueNames = issues.map(i => i.name);
  const {issue} = await inquirer.prompt({
    name: 'issue',
    type: 'autocomplete',
    message: 'Select an issue',
    source: function(answersSoFar, input) {
      let results = issues;
      if (input) {
        results = fuzzy.filter(input, issues, {
          extract: el => el.name,
        }).map(i => i.original);
      }
      return Promise.resolve(results);
    },
  });
  return issue;
};
