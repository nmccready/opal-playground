module.exports = {
  extends: ['airbnb-base', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },

  settings: {
    'import/resolver': {
      typescript: {},
    },
  },
  rules: {
    'max-len': ['error', { code: prettier.printWidth, ignoreUrls: true }], // KEEP THIS IN SYNC
    indent: 'off',
    rules: {
      'comma-dangle': 0,
    },
  },
};
