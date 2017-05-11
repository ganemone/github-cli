const inquirer = require('inquirer');
const github = require('../../github.js');
const toPromptChoices = require('../../to-prompt-choices.js');
exports.command = 'create';
exports.desc = 'Create a github issue';
exports.builder = {};
exports.handler = async function create(argv) {
  const {project, repo, owner, username} = argv;
  const [
    {title, body, selfAssign},
    columnsResponse,
    labelsResponse,
  ] = await Promise.all([
    inquirer.prompt([
      {
        name: 'title',
        type: 'input',
        message: 'Title: ',
      },
      {
        name: 'body',
        type: 'input',
        message: 'Description: ',
      },
      {
        name: 'selfAssign',
        type: 'confirm',
        message: 'Assign yourself?',
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
  const columnChoices = rawColumns.map(toPromptChoices);
  const labelChoices = rawLabels.map(toPromptChoices);
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
        const columnName = column.name.toLowerCase();
        return labelChoices.map(choice => {
          if (choice.name.toLowerCase() === columnName) {
            choice.checked = true;
          }
          return choice;
        });
      },
    },
  ]);

  const labelNames = labels.map(l => l.name);

  console.log(
    'About to create the following issue:\n',
    JSON.stringify(
      {
        title,
        body,
        column: column.name,
        labels: labelNames,
      },
      null,
      2
    )
  );
  const {confirm} = await inquirer.prompt({
    name: 'confirm',
    type: 'confirm',
    message: 'Continue?',
  });
  // TODO: Add code to handle going editing the current state
  if (!confirm) {
    console.log('Exiting...');
    return;
  }
  return createIssue({
    columnId: column.id,
    username,
    title,
    body,
    labels,
    owner,
    repo,
    selfAssign,
  });
};

async function createIssue(options) {
  const {username, title, body, columnId, labels, owner, repo, selfAssign} = options;
  const assignee = selfAssign ? username : null;
  const issueResp = await github.issues.create({
    assignee,
    owner,
    repo,
    title,
    body,
    labels,
  });
  const issueId = issueResp.data.id;
  const cardResp = await github.projects.createProjectCard({
    column_id: columnId,
    content_id: issueId,
    content_type: 'Issue',
  });
  console.log('Created issue: ', issueResp.data.html_url);
  return issueResp.data;
}
