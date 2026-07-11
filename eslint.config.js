module.exports = [
  {
    files: ["**/*.js", "**/*.jsx"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        // Node globals
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        process: "readonly",
        __dirname: "readonly",
        console: "readonly",
        // Browser globals
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        fetch: "readonly",
        navigator: "readonly",
        // React/JSX
        React: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { "vars": "all", "args": "none" }],
      "no-undef": "error"
    }
  }
];
