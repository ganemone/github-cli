const inquirer = require('inquirer');
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
    merge_method: 'merge',
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
};

async function getCurrentPR(args) {
  const {owner, repo, username} = args;
  const currentBranch = await getCurrentBranch();
  const resp = await github.pullRequests.getAll({
    owner,
    repo,
    head: `${username}:${currentBranch}`,
  });
  return Array.isArray(resp.data) ? resp.data[0] : null;
}
