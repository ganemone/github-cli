const github = require('./github.js');

module.exports = async function loadCards(args) {
  const {project} = args;
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
        card.contentNumber = Number(matches[2]);
      }
      return card;
    })
    .filter(card => {
      // TODO: Support cards that are notes or pull requests, not only issues
      return card.contentType === 'issues';
    });
  return cards;
};
