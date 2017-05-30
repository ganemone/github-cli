const inquirer = require('inquirer');
const github = require('../../github.js');
const toPromptChoices = require('../../to-prompt-choices.js');
exports.command = 'create';
exports.desc = 'Create a github issue';
exports.builder = {};
exports.handler = async function create(argv) {
  const {project, repo, owner, username, destination} = argv;
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
  let column = rawColumns.find(c => {
    return (
      destination && c.name.toLowerCase().includes(destination.toLowerCase())
    );
  });
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'column',
      message: 'Choose a column: ',
      choices: columnChoices,
      when: () => !column,
    },
    {
      type: 'checkbox',
      name: 'labels',
      message: 'Choose labels: ',
      choices: answers => {
        const col = answers.column || column;
        const columnName = col.name.toLowerCase();
        return labelChoices.map(choice => {
          if (choice.name.toLowerCase() === columnName) {
            choice.checked = true;
          }
          return choice;
        });
      },
    },
  ]);
  if (!column) {
    column = answers.column;
  }
  const {labels} = answers;
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
  const issue = await createIssue({
    columnId: column.id,
    username,
    title,
    body,
    labels,
    owner,
    repo,
    selfAssign,
  });
  console.log(`Created issue: ${issue.html_url}`);
  return issue;
};

// TODO: When starting a dev workflow, don't prompt for the column for the issue
async function createIssue(options) {
  const {
    username,
    title,
    body,
    columnId,
    labels,
    owner,
    repo,
    selfAssign,
  } = options;
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
  const cardsResponse = await github.projects.createProjectCard({
    column_id: columnId,
    content_id: issueId,
    content_type: 'Issue',
  });

  const issue = issueResp.data;
  issue.card = cardsResponse.data;
  return issue;
}
