# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2026-03-31

### @visaacceptance/agent-toolkit

#### Added
- Comprehensive test coverage with Jest
  - Unit tests for all invoice and payment link operations
  - Integration tests for end-to-end API validation
  - Test configuration and helper utilities
- Environment configuration documentation in README
- Link to MCP documentation in main README
- Global TypeScript type definitions (`src/global.d.ts`)
- New `src/index.ts` as main entry point for consolidated exports
- Bridge modules (`.js` files) for better module compatibility

#### Changed
- **Build System**: Switched from `tsup` to `tsc` for compilation
- **TypeScript Configuration**: Enhanced `tsconfig.json` with modern Node.js settings
  - Added `composite: true` for project references
  - Enabled `isolatedModules` and `resolveJsonModule`
  - Updated to use `NodeNext` module resolution
  - Added support for mixed JS/TS codebases
- **Package Exports**: Restructured exports in `package.json` for better module resolution
  - Main entry: `./dist/index.js`
  - AI SDK: `./dist/ai-sdk/index.js`
  - MCP: `./dist/modelcontextprotocol/index.js`
- **Documentation**: Corrected action names from `list`/`get` to `read` (reflects actual implementation)
- **API Configuration**: Updated to support `disableSSLVerification` option
- **Logging**: Changed default log directory from `vap` to `./log`
- **Dependencies**: Updated package versions
  - `ai`: ^4.3.11 → ^5.0.59
  - `axios`: ^1.9.0 → ^1.12.2
  - `cybersource-rest-client`: ^0.0.67 → ^0.0.71
  - `openai`: ^4.96.2 → ^5.19.1

#### Fixed
- Tool filtering logic in AI SDK toolkit
- Import/export consistency across modules
- Masking utility organization (moved to dedicated `masking.ts` file)

#### Developer Experience
- Added comprehensive local development documentation
- Improved npm linking workflow instructions
- Better `.gitignore` patterns for logs, test files, and platform-specific files
- Added `.env.test.template` for integration test setup

#### AI SDK Example (visa-acceptance-agent-toolkit-ai-sdk-example)

##### Added
- Updated example with better OpenAI configuration
- Support for custom `OPENAI_BASE_URL` and `OPENAI_API_KEY`
- Improved README with setup instructions

##### Changed
- Updated to use `createOpenAI` from `@ai-sdk/openai`
- Simplified example code structure
- Updated dependencies to match core toolkit versions

---

### @visaacceptance/mcp

#### Added
- Tool permissions documentation table

#### Changed
- **Module System**: Converted from CommonJS `require` to ES6 `import` statements
- **TypeScript Configuration**: Enhanced with project references
  - Added reference to `../typescript` package
  - Enabled `composite: true` for better monorepo support
  - Added `sourceMap: true` for debugging
- **Package Configuration**: Updated `package.json`
  - Changed `type` to `"commonjs"`
  - Updated main entry points to `dist/src/` directory
  - Updated `link` script to link agent-toolkit dependency
- **Documentation**: Updated MCP Inspector debugging instructions

#### Removed
- Verbose local development workflow (consolidated to root README)
- Redundant masking logic from toolkit (now handled by shared utilities)

#### Fixed
- Import paths and module resolution
- Tool registration and filtering
- Copyright headers added to all type definition files

---

## Notes

### Breaking Changes
None. All changes are backward compatible.

### Migration Guide
No migration required. Existing integrations will continue to work without changes.