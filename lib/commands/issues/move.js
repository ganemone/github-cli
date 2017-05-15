const github = require('../../github.js');
const selectProjectColumn = require('../../select-project-column.js');
const selectIssue = require('../../select-issue.js');

exports.command = 'move';
exports.desc = 'Move a github issue between project columns';
exports.builder = {};
// TODO: Add label matching column name
exports.handler = async function move(argv) {
  let {project, owner, repo, destination, issue} = argv;
  if (!issue) {
    issue = await selectIssue({project, owner, repo});
  }
  if (!destination) {
    destination = await selectProjectColumn(project);
  }

  const columnsResponse = await github.projects.getProjectColumns({
    project_id: project,
  });

  if (typeof destination === 'string') {
    destination = columnsResponse.data.find(c =>
      c.name.toLowerCase().includes(destination.toLowerCase())
    );
    if (!destination) {
      throw new Error(`Could not find project column: ${destination}`);
    }
  }

  const columnNames = columnsResponse.data
    .map(c => c.name.toLowerCase())
    .filter(c => c.name !== destination.name.toLowerCase());

  const labelsToRemove = issue.labels.filter(l => columnNames.includes(l.name));

  const resp = await github.projects.moveProjectCard({
    id: issue.card.id,
    position: 'top',
    column_id: destination.id,
  });

  await Promise.all(
    labelsToRemove.map(label => {
      return github.issues.removeLabel({
        owner,
        repo,
        number: issue.number,
        name: label.name,
      });
    })
  );

  await github.issues.addLabels({
    owner,
    repo,
    number: issue.number,
    labels: [destination.name.toLowerCase()],
  });

  return {issue, destination, resp};
};
