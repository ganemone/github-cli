const github = require('./github.js');
const autocomplete = require('./autocomplete.js');

module.exports = async function selectPR(args) {
  const {owner, repo} = args;
  const pullRequestsResp = await github.pullRequests.getAll({
    owner,
    repo,
  });
  const choices = pullRequestsResp.data.map(pr => {
    return {
      name: pr.title,
      value: pr,
    };
  });
  const {pr} = await autocomplete(choices, {
    name: 'pr',
    message: 'Select a PR',
  });
  return pr;
};
