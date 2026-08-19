module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  rules: {
    // React 17+ 不需要在每个文件 import React
    'react/react-in-jsx-scope': 'off',
    // 禁止使用 any（RULES.md 要求）
    '@typescript-eslint/no-explicit-any': 'error',
    // 未使用变量报错，下划线前缀的参数除外
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    // 不强制要求显式返回类型（对简单组件太繁琐）
    '@typescript-eslint/explicit-function-return-type': 'off',
    // 禁止 console.log（RULES.md 要求）
    'no-console': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  env: {
    es2021: true,
    node: true,
  },
  ignorePatterns: ['node_modules/', 'dist/', '.expo/'],
};
