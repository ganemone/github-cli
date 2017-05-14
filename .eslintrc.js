module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2017,
  },
  extends: 'eslint:recommended',
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': ['error', {trailingComma: 'es5', singleQuote: true, bracketSpacing: false}],
    'no-console': 'off',
  },
};
