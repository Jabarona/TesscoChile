module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Reglas de estilo
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    
    // Reglas de código
    'no-unused-vars': 'warn',
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'error',
    
    // Reglas de buenas prácticas
    'eqeqeq': 'error',
    'curly': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    
    // Reglas de ES6+
    'prefer-const': 'error',
    'no-var': 'error',
    'arrow-spacing': 'error',
    'template-curly-spacing': 'error'
  },
  globals: {
    // Variables globales del navegador
    'window': 'readonly',
    'document': 'readonly',
    'navigator': 'readonly',
    'localStorage': 'readonly',
    'sessionStorage': 'readonly',
    'fetch': 'readonly',
    
    // Variables globales de Node.js
    'process': 'readonly',
    'Buffer': 'readonly',
    '__dirname': 'readonly',
    '__filename': 'readonly',
    
    // Variables globales personalizadas
    'APP_CONFIG': 'readonly',
    'utils': 'readonly',
    'cart': 'readonly',
    'ECOMMERCE_CONFIG': 'readonly'
  }
};
