module.exports = {
  env: {
    es2022: true,
    node: true,
  },
  parserOptions: {
    // Node 24: el código usa ?., ?? y otras sintaxis posteriores a 2018
    "ecmaVersion": 2022,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    "quotes": ["error", "double", {"allowTemplateLiterals": true}],
    // Git convierte los saltos de línea (core.autocrlf): no es asunto del código
    "linebreak-style": "off",
    // Convención del proyecto: comentarios en español, no JSDoc
    "require-jsdoc": "off",
    "valid-jsdoc": "off",
    "max-len": ["error", {
      "code": 120,
      "ignoreComments": true,
      "ignoreUrls": true,
      "ignoreStrings": true,
      "ignoreTemplateLiterals": true,
      "ignoreRegExpLiterals": true,
    }],
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};
