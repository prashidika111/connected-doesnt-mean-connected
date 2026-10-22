# Integration notes

This version keeps the original React, TypeScript and Vite application as the foundation.

## Integrated and updated

- Added destination diagnostics to the main navigation.
- Added a homepage URL or IP input that starts a check and opens the results view.
- Redesigned the homepage so destination checks, guided diagnosis and scenario learning are visible together.
- Kept the existing five question questionnaire and deterministic evaluator.
- Added a scenario library that clearly distinguishes the supplied DNS simulation from concepts without prepared simulation files.
- Reused the original typed diagnostic backend, target validation, evidence mapping and path stage generation rather than maintaining a separate plain HTML application.
- Lifted the latest live diagnostic report into application state so the report survives navigation away from the diagnostic view.
- Added target validation tests for common unsafe and malformed inputs.
- Updated the DNS scenario and guide to use the supplied single LAN addressing: router `192.168.0.1`, laptop `192.168.0.100`, DNS `192.168.0.10`, web server `192.168.0.20`, and incorrect DNS `192.168.0.99`.
- Updated HTTP interpretation so an HTTP error status is explained as a server response, not a failed network connection.
- Replaced academic progress language in the main navigation, homepage and explanatory page.
- Updated the README with local run, test and build instructions and diagnostic limitations.

## Verification status

A syntax transpilation check passed for all 27 TypeScript and TSX files. Full type checking, automated tests and the production build have not been verified in this environment. Dependency installation could not complete because the package registry was not reachable within the execution window. Run `npm install`, `npm test`, and `npm run build` on the target Windows machine before relying on this version for a presentation.

The destination checks are intended for local classroom use through the Vite development server. They must not be exposed as an unrestricted public service without a separate security review.

## Additional local diagnostic integration

Added a local network panel to the destination investigation workspace:
- Interface addresses and configuration from `os.networkInterfaces()`.
- Default IPv4 gateway discovery from the OS routing table (`route print -4` on Windows, `route -n get default` on macOS, `ip route show default` on Linux).
- A single gateway ping, with a clear warning that ICMP may be filtered.
- Route tracing to a validated public destination via `tracert`/`traceroute`.
- Explicit explanation that measurements come from the computer running the Node.js server, not automatically the browser client.

The global visual style was updated to Times New Roman and muted pastel colours. Full build/test verification could not be completed in this packaging environment because dependency installation did not finish; run `npm install`, `npm test`, and `npm run build` on the Windows development machine before the demo. `traceroute` may not be installed by default on Linux; Windows uses the built-in `tracert` command.
