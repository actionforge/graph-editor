# Actionforge Graph Editor
<!-- markdownlint-disable MD033 -->

<div align="center" width="100%">
  <img src="assets/logo.svg" alt="Graph Runner Logo">

[![view-action-graph](https://img.shields.io/github/actions/workflow/status/actionforge/graph-editor/workflow.yml?label=View%20Action%20Graph)](https://www.actionforge.dev/github/actionforge/graph-editor/main/.github/workflows/graphs/workflow.yml)
[![made-with-ts](https://img.shields.io/badge/Made%20with-TS-3178C6.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-ACL-blue?color=orange)](https://www.github.com/actionforge/legal/blob/main/LICENSE.md)

</div>

Welcome to the source code of the Actionforge Graph Editor! The editor is embedded in the [VS Code Extension](https://www.github.com/actionforge/vscode-ext) and the [website](https://www.github.com/actionforge/website).

## Prerequisites

Before you begin, make sure you have installed:

- Node.js
- Angular CLI

## Building the Application

The easiest way to get the editor up and running is through VS Code. Simply open the repository, install all dependencies and run the configuration called **ng serve (web)**. Use the commands below for production builds.

### Building for Web Browsers

```bash
npm run build:web
```

### Building for VS Code

```bash
npm run build:vscode
```

## Running the Application

To serve the application locally run the command below. The app will be served on `http://localhost:4400`.

```bash
npm start
```

### Additional Information

For more detailed configurations, refer to the `angular.json` and `package.json` files in this repository.

## License

This SOFTWARE is licensed under the Actionforge Community License that you can find [here](https://github.com/actionforge/legal/blob/main/LICENSE.md).

Licenses for commercial use will soon be available on the GitHub Marketplace. For further information [Get in touch](mailto:hello@actionforge.dev).
