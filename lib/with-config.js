const github = require('./github.js');
const {loadStrict} = require('./config.js');
module.exports = function wrap(builder) {
  return function withConfig(argv) {
    const config = loadStrict();
    for (const key in config) {
      argv.default(key, config[key]);
    }
    github.authenticate({
      type: 'token',
      token: config.token,
    });
    return builder(argv);
  };
};
