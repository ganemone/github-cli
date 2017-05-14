const yargs = require('yargs');

exports.command = 'pr <command>';
exports.desc = 'Github pull requests';
exports.builder = function issueCmd(/* argv */) {
  return yargs.commandDir('./pr').demandCommand(1).fail((msg, err, yargs) => {
    if (err) throw err;
    console.error(msg);
    console.error(yargs.help());
    process.exit(1);
  });
};
