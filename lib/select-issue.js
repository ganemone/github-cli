const github = require('./github.js');
const loadCards = require('./load-cards.js');
const autocomplete = require('./autocomplete.js');

// TODO: Maybe delete this and always select project cards instead
module.exports = async function selectIssue(options) {
  const {source = 'project'} = options;
  const getIssues = source === 'project'
    ? getIssuesFromProject(options)
    : getIssuesFromRepo(options);
  const issues = await getIssues;
  const choices = issues.map(i => {
    return {
      name: i.title,
      value: i,
    };
  });
  const {issue} = await autocomplete(choices, {
    name: 'issue',
    type: 'autocomplete',
    message: 'Select an issue',
  });
  return issue;
};

async function getIssuesFromRepo(options) {
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
  return issues;
}

async function getIssuesFromProject(options) {
  const {owner, repo} = options;
  const cards = await loadCards(options);
  const issues = await Promise.all(
    cards.map(card => {
      return github.issues
        .get({
          owner,
          repo,
          number: card.contentNumber,
        })
        .then(resp => {
          const issue = resp.data;
          issue.card = card;
          return issue;
        });
    })
  );
  return issues;
}
