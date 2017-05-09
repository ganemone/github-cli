const {loadStrict} = require('./config.js');
module.exports = function wrap(builder) {
  return function withConfig(argv) {
    const config = loadStrict();
    for (const key in config) {
      argv.default(key, config[key]);
    }
    return builder(argv);
  };
};
