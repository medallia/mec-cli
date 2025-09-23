import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';

export default [
  // Base JavaScript configuration
  js.configs.recommended,
  
  // TypeScript configuration for Node.js CLI
  {
    files: ['src/**/*.ts', 'bin/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json'
      },
      globals: {
        // Node.js environment globals
        ...globals.node
      }
    },
    settings: {
      'import/resolver': {
        'typescript': {
          'alwaysTryTypes': true,
          'project': './tsconfig.json'
        }
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'import': importPlugin
    },
    rules: {
      // Inherit TypeScript recommended rules
      ...tsPlugin.configs.recommended.rules,
      
      // Import ordering and organization rules
      'import/order': ['error', {
        'groups': [
          'builtin',     // Node.js built-in modules
          'external',    // npm packages
          'internal',    // Internal modules (configured paths)
          'parent',      // Parent directory imports
          'sibling',     // Same directory imports
          'index'        // Index file imports
        ],
        'newlines-between': 'always',
        'alphabetize': {
          'order': 'asc',
          'caseInsensitive': true
        }
      }],
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      
      // TypeScript-specific rules
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-var-requires': 'error',
      // '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',

      // Turn off conflicting base rules in favor of TypeScript versions
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': 'error',

      // Node.js/CLI specific rules
      'no-console': 'off', // Allow console in CLI apps
      'no-process-exit': 'off', // Allow process.exit in CLI apps

      // Code quality and best practices
      'prefer-const': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'no-var': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'prefer-arrow-callback': 'warn',
      
      // Formatting rules (defer to Prettier)
      'arrow-spacing': 'off', // Prettier handles this
      'no-trailing-spaces': 'off', // Prettier handles this
      'comma-dangle': 'off' // Prettier handles this - avoid conflict
    }
  },
  {
    ignores: [
      'dist/',
      'node_modules/',
      'coverage/',
      '*.js',
      '*.mjs',
      'tests/',
      'temp/',
      '**/*.d.ts'
    ]
  }
];
