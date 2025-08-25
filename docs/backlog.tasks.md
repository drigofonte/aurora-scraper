- [x] Cleanup the codebase by removing any unnecessary .md files
- [x] Cleanup the codebase by removing any unnecessary debug files
- [x] Review the html-transformer-fixed.test.ts and the html-transformer.test.
      Are they both needed? Could we merge one into the other?
- [x] Decide on where to place practical examples of how to use the scraping ETL
      pipeline. Sounds like docs/examples might be a good place, with a
      README.md for each example and complete documentation showing how to
      scrape single items, lists of items, etc.
- [ ] Test the current examples in the docs/examples folder
- [ ] Create other local examples listed in the README.md
- [ ] Create real-world examples listed in the README.md
- [ ] Remove integration tests using the barcelona events from the pipeline
- [ ] Review the use of schemas in the schemas folder. Could they be deleted or
      moved to a docs/examples folder?
- [ ] Create spec files for the extractor, transformer and loader modules. This
      should have been done before the implementation. It should complement the
      etl-pipeline-spec.md
- [ ] Refactor all examples in the code into a docs/examples folder.
- [ ] Research SAST tool
- [ ] Integrate Sonarqube (or similar) checks as part of the commit pipeline
- [ ] Integrate test coverage metrics into the commit pipeline
- [ ] Create devcontainer setup
- [ ] Revise the need for the setup_typescript.sh file. Isn't there a better way
      to do this?
- [ ] Ideate on what would features would make this library ideal for using with
      coding assistants such as GitHub Copilot, Cursor, Windsurf, etc. What is
      the optimum documentation for these tools? Should we create custom,
      reusable chat modes? Is it just about creating MCP tools for all features?
- [ ] Ideate the creation of MCP tools for the extractor, transformer and
      loader, so that agents can act as orchestrators themselves if they wanted
      to. Create a spec file.
- [ ] Ideate the creation of a crawler package that can complement the pipeline
      by feeding it pages. Create a spec file.
- [x] Revise the design of the scraper and create clear Extractor.extract() and
      Transformer.transform() functions.
- [x] Implement comprehensive TypeScript best practices and project setup
- [x] Add ESLint and Prettier configuration with strict rules
- [x] Create custom error classes following TypeScript patterns
- [x] Implement Result/Either pattern for functional error handling
- [x] Add structured logging with configurable levels
- [x] Create environment-based configuration management
- [x] Set up Vitest testing framework with coverage
- [x] Improve code organization following SOLID principles
- [x] Add type-safe validation with proper error reporting
- [x] Update project documentation with comprehensive guides
