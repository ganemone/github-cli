const yargs = require('yargs');

exports.command = 'issue <command>';
exports.desc = 'Github Issues';
exports.builder = function issueCmd(/* argv */) {
  return yargs
    .commandDir('./issues')
    .demandCommand(1)
    .fail((msg, err, yargs) => {
      if (err) throw err;
      console.error(msg);
      console.error(yargs.help());
      process.exit(1);
    });
};
