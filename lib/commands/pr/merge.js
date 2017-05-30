const inquirer = require('inquirer');
const cp = require('child-process-promise');
const github = require('../../github.js');
const selectPR = require('../../select-pr.js');
const getCurrentBranch = require('../../get-current-branch.js');
const findIssueCard = require('../../find-issue-card.js');
const moveIssue = require('../issues/move.js').handler;

exports.command = 'merge';
exports.desc = 'Merge a pull request';
exports.builder = {};
exports.handler = async function merge(args) {
  const {owner, repo} = args;
  let pr = args.pr;
  if (!pr) {
    console.log('Loading pr from current branch...');
    pr = await getCurrentPR(args);
  }
  if (!pr) {
    pr = await selectPR(args);
  }
  const {confirmed} = await inquirer.prompt({
    type: 'confirm',
    name: 'confirmed',
    message: `Merge: ${pr.title}`,
  });
  if (!confirmed) {
    return;
  }
  console.log('Merging pull request...');
  const doMerge = github.pullRequests.merge({
    owner,
    repo,
    number: pr.number,
    merge_method: 'squash',
  });
  const issueReg = /#([0-9]+)$/;
  const matches = issueReg.exec(pr.head.ref);
  if (!matches) {
    console.warn('Could not find associated issue with pull request');
    return;
  }
  const issueNumber = Number(matches[1]);
  const issue = await findIssueCard(
    Object.assign(
      {
        issueNumber,
      },
      args
    )
  );

  // TODO: Have 'done' column configurable
  const doMoveIssue = moveIssue(
    Object.assign({}, args, {issue, destination: 'done'})
  );

  const doCloseIssue = github.issues.edit({
    owner,
    repo,
    number: issueNumber,
    state: 'closed',
  });

  await Promise.all([doMerge, doMoveIssue, doCloseIssue]);
  console.log(`Closed Issue: ${issue.html_url}`);
  console.log(`Merged Pull Request: ${pr.html_url}`);

  const issueBranch = await getCurrentBranch();

  console.log('Checking out to master...');
  await cp.exec('git checkout master');

  const {cleanup} = await inquirer.prompt({
    type: 'confirm',
    name: 'cleanup',
    message: 'Cleanup local branch?',
  });

  if (cleanup) {
    console.log(`Cleaning up branch ${issueBranch}`);
    await cp.exec(`git branch -D ${issueBranch}`);
  }

  console.log('Done!');
};

async function getCurrentPR(args) {
  const {owner, repo} = args;
  const currentBranch = await getCurrentBranch();
  const prArgs = {
    owner,
    repo,
    // TODO: verify this works for non-organization PRs
    head: `${owner}:${currentBranch}`,
  };
  const resp = await github.pullRequests.getAll(prArgs);
  return Array.isArray(resp.data) ? resp.data[0] : null;
}
