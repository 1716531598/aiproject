module.exports = {
  extends: require.resolve('@umijs/max/eslint'),
  rules: {
    'no-useless-escape': 'off',
    'react/no-string-refs': 'off',
    'guard-for-in': 'off',
    'react/no-deprecated': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/no-unused-expressions': 'off',
  },
};
