const github = require('./github.js');

module.exports = async function selectProjectColumn(project) {
  const columnsResponse = await github.projects.getProjectColumns({
    project_id: project,
  });
  if (!columnsResponse.data || !columnsResponse.data.length) {
    throw new Error('Could not find project columns');
  }
  return columnsResponse.data;
};
