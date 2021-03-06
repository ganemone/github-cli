const github = require('../../github.js');
const cp = require('child-process-promise');
const findIssueCard = require('../../find-issue-card.js');
const moveIssue = require('../issues/move.js').handler;
const loadProjectColumns = require('../../load-project-columns.js');
const getCurrentBranch = require('../../get-current-branch.js');

exports.command = 'create';
exports.desc = 'Create a pull request';
exports.builder = {};
exports.handler = async function create(argv) {
  const {project, owner, repo, defaultReviewers} = argv;
  const currentBranch = await getCurrentBranch();
  const branchRegex = /issue#([0-9]+)/;
  const match = branchRegex.exec(currentBranch);
  if (!match) {
    throw new Error('Not on a valid branch');
  }
  const issueNumber = Number(match[1]);
  console.log('Loading issue...');
  const issue = await findIssueCard(Object.assign({issueNumber}, argv));
  const columns = await loadProjectColumns(project);
  const destination = columns.find(c =>
    c.name.toLowerCase().includes('review')
  );

  console.log('Moving issue into in review...');
  await moveIssue(Object.assign({issue, destination}, argv));

  console.log(`Pushing to branch ${currentBranch}...`);
  await cp.exec(`git push origin ${currentBranch}`);

  console.log('Creating pull request...');
  const prResp = await github.pullRequests.create({
    owner,
    repo,
    title: issue.title,
    body: `Fixes #${issue.number}`,
    head: currentBranch,
    base: 'master',
  });
  const pr = prResp.data;
  console.log(`Created Pull Request: ${pr.html_url}`);

  if (defaultReviewers && defaultReviewers.length) {
    console.log('Adding reviewers...');
    // TODO: Add prompt here
    await github.pullRequests.createReviewRequest({
      owner,
      repo,
      number: prResp.data.number,
      reviewers: defaultReviewers,
    });
  }
};
