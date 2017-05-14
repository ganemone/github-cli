const github = require('./github.js');
const loadCards = require('./load-cards.js');

module.exports = async function findIssueCard(args) {
  const cards = await loadCards(args);
  console.log('cards', cards);
}
