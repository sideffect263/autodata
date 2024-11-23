module.exports = {
    parser: '@babel/eslint-parser',
    extends: [
      'eslint:recommended',
      'plugin:react/recommended',
      'plugin:react-hooks/recommended'
    ],
    plugins: ['react', 'react-hooks'],
    env: {
      browser: true,
      es2021: true,
      node: true
    },
    globals: {
      module: 'writable'
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      'react/no-unknown-property': ['error', { ignore: ['position', 'args', 'array', 'count', 'itemSize', 'side', 'shininess', 'wireframe'] }],
      'react/prop-types': 'off', // Disable prop-types rule if you are using TypeScript or prefer not to use prop-types
      'no-unused-vars': 'warn' // Change to 'warn' to avoid breaking the build
    }
  };