const inquirer = require('inquirer');
const github = require('../../github.js');
exports.command = 'create';
exports.desc = 'Create a github issue';
exports.builder = {};
exports.handler = async function create(argv) {
  const {project, repo, owner} = argv;
  const [{title, description}, columnsResponse, labelsResponse] = await Promise.all([
    inquirer.prompt([
      {
        name: 'title',
        type: 'input',
        message: 'Title: ',
      },
      {
        name: 'description',
        type: 'input',
        message: 'Description: ',
      },
    ]),
    github.projects.getProjectColumns({
      project_id: project,
    }),
    github.issues.getLabels({
      owner,
      repo,
    }),
  ]);
  if (!columnsResponse || !columnsResponse.data) {
    throw new Error('Failed to load columns', columnsResponse);
  }
  if (!labelsResponse || !labelsResponse.data) {
    throw new Error('Failed to load labels', labelsResponse);
  }
  const rawColumns = columnsResponse.data;
  const rawLabels = labelsResponse.data;
  const columnChoices = rawColumns.map(toInquirerChoices);
  const labelChoices = rawLabels.map(toInquirerChoices);
  const {column, labels} = await inquirer.prompt([
    {
      type: 'list',
      name: 'column',
      message: 'Choose a column: ',
      choices: columnChoices,
    },
    {
      type: 'checkbox',
      name: 'labels',
      message: 'Choose labels: ',
      choices: ({column}) => {
        console.log('column', column);
        return labelChoices;
      },
    },
  ]);
  console.log('About to create the following issue: ', {
    title,
    description,
    column,
    labels,
  });
};

function toInquirerChoices(i) {
  return {
    name: i.name,
    value: i,
  };
}
