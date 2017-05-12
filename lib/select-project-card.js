const inquirer = require('inquirer');
const github = require('./github.js');
const toPromptChoices = require('./to-prompt-choices.js');

module.exports = async function selectProjectCard(args) {
  const {project, owner, repo} = args;
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

  const cardDetails = await Promise.all(
    cards.map(card => {
      return github.issues
        .get({
          owner,
          repo,
          number: card.contentNumber,
        })
        .then(({data}) => {
          card.issue = data;
          return card;
        });
    })
  );

  // TODO: Update this to use the autocomplete prompt
  const {card} = await inquirer.prompt({
    type: 'list',
    message: 'Choose an issue',
    name: 'card',
    choices: cardDetails.map(detailedCard => {
      return {
        name: detailedCard.issue.title,
        value: detailedCard,
      };
    }),
  });

  return card;
};
