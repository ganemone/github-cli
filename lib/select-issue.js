const github = require('./github.js');
const fuzzy = require('fuzzy');
const inquirer = require('inquirer');

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
  const {issue} = await inquirer.prompt({
    name: 'issue',
    type: 'autocomplete',
    message: 'Select an issue',
    source: function(answersSoFar, input) {
      let results = choices;
      if (input) {
        results = fuzzy
          .filter(input, choices, {
            extract: el => el.name,
          })
          .map(i => i.original);
      }
      return Promise.resolve(results);
    },
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
  const {project, owner, repo} = options;
  const columnsResponse = await github.projects.getProjectColumns({
    project_id: project,
  });

  const columns = columnsResponse.data;

  const cardsResponses = await Promise.all(
    columns.map(col => {
      return github.projects.getProjectCards({
        column_id: col.id,
      });
    })
  );

  const cards = cardsResponses
    .reduce((acc, item) => {
      return acc.concat(item.data);
    }, [])
    .map(card => {
      const matchUrl = /\/([a-z]+)\/([0-9]+)$/;
      const matches = matchUrl.exec(card.content_url);
      if (matches) {
        card.contentType = matches[1];
        card.contentNumber = matches[2];
      }
      return card;
    })
    .filter(card => {
      // TODO: Support cards that are notes or pull requests, not only issues
      return card.contentType === 'issues';
    });

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
