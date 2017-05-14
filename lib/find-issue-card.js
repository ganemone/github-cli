const github = require('./github.js');
const loadCards = require('./load-cards.js');

module.exports = async function findIssueCard(args) {
  const {owner, repo, issueNumber} = args;
  const cards = await loadCards(args);
  const card = cards.find(c => c.contentNumber === issueNumber);
  const issuesResponse = await github.issues.get({
    owner,
    repo,
    number: issueNumber,
  });
  const issue = issuesResponse.data;
  issue.card = card;
  return issue;
};
