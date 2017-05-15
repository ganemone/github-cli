const inquirer = require('inquirer');
const fuzzy = require('fuzzy');

module.exports = async function autocomplete(choices, options) {
  return inquirer.prompt(
    Object.assign(
      {
        type: 'autocomplete',
        source: function(currentAnswers, input) {
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
      },
      options
    )
  );
};
