const inquirer = require('inquirer');
const GitHubApi = require('github');
const github = new GitHubApi();

module.exports = function runCli() {
  inquirer
    .prompt([
      {
        name: 'username',
        message: 'Github username: ',
        type: 'input',
        when: () => !process.env.USERNAME,
      },
      {
        name: 'password',
        message: 'Github password: ',
        type: 'password',
        when: () => !process.env.PASSWORD,
      },
      {
        name: 'organization',
        message: 'Organization: ',
        type: 'input',
        when: () => !process.env.REPO && !process.env.ORGANIZATION,
      },
    ])
    .then(answers => {
      if (answers.username) {
        process.env.USERNAME = answers.username;
      }
      if (answers.password) {
        process.env.PASSWORD = answers.password;
      }
      if (answers.organization) {
        process.env.ORGANIZATION = answers.organization;
      }
      run();
    });
};

function run() {
  const token = process.env.TOKEN;
  const username = process.env.USERNAME;
  const password = process.env.PASSWORD;
  const orgName = process.env.ORGANIZATION;
  const repoName = process.env.REPO;

  github.authenticate({
    type: 'token',
    token,
  });

  github.projects
    .getRepoProjects({
      owner: orgName,
      repo: repoName,
    })
    .then(response => {
      if (!response || !response.data) {
        throw new Error('Error loading projects');
      }
      const projects = response.data;
      if (projects.length > 1) {
        // TODO: prompt for user to pick project
        throw new Error('Multiple projects not supported yet');
      } else if (projects.length === 0) {
        throw new Error('Could not find any projects');
      } else {
        const project = projects[0];
        return project;
      }
    })
    .then(runWithProject);
}

function runWithProject(project) {
  return github.projects
    .getProjectColumns({project_id: project.id})
    .then(resp => {
      if (!resp || !resp.data) {
        throw new Error('Failed to load column data');
      }
      const columns = resp.data;
      const choices = columns.map(column => ({
        name: column.name,
        value: column,
      }));
      return inquirer.prompt([
        {
          name: 'column',
          type: 'list',
          message: 'Choose A Column',
          choices,
        },
      ]);
    })
    .then(({column}) => {
      return github.projects.getProjectCards({column_id: column.id});
    })
    .then(cards => {
      console.log('cards', cards);
    });
}
