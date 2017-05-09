process.on('unhandledRejection', e => {
  throw e;
});

const wrapWithConfig = require('../lib/with-config.js');

require('yargs')
  .commandDir('../lib/commands', {
    visit: (command, filePath, filename) => {
      if (command.command !== 'init') {
        command.builder = wrapWithConfig(command.builder);
      }
      return command;
    },
  })
  .demandCommand(1)
  .fail((msg, err, yargs) => {
    if (err) throw err;
    console.error(msg);
    console.error(yargs.help());
    process.exit(1);
  })
  .version()
  .help().argv;

