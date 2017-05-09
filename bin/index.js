process.on('unhandledRejection', e => {
  throw e;
});
require('yargs')
  .commandDir('../commands')
  .demandCommand(1)
  .fail((msg, err, yargs) => {
    if (err) throw err;
    console.error(msg);
    console.error(yargs.help());
    process.exit(1);
  })
  .version()
  .help().argv;
