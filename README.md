# Connected Doesn’t Mean Connected

An educational network diagnosis and visual explanation application. It helps users understand why a device may appear connected while a later part of communication fails.

## Features

- A homepage with direct access to destination checks, guided diagnosis and the DNS learning scenario.
- URL, hostname and public IP validation.
- A local diagnostic endpoint that checks DNS, TCP connectivity and HTTP or HTTPS response where applicable.
- Evidence based result summaries with explicit check status and execution location.
- A network path view that distinguishes measured results from conceptual or untested stages.
- A five question guided questionnaire with deterministic diagnosis rules.
- A Cisco Packet Tracer guide for the DNS failure demonstration.

## Requirements

- Node.js 20 or newer.
- npm.
- A modern browser.
- Cisco Packet Tracer installed locally for the simulation exercise.

## Install and run on Windows

1. Extract the project ZIP.
2. Open the extracted `CN Project` folder in VS Code.
3. Open Terminal, then New Terminal.
4. Install dependencies:

   ```powershell
   npm install
   ```

5. Start the local application:

   ```powershell
   npm run dev
   ```

6. Open the local address shown in the terminal, usually `http://localhost:5173`.

Keep the terminal running while using destination checks. The diagnostic endpoint is provided by the Vite development server plugin.

## Tests and production build

Run the automated tests:

```powershell
npm test
```

Create a production build:

```powershell
npm run build
```

Preview the production build:

```powershell
npm run preview
```

The development diagnostic endpoint is attached to Vite. Do not assume it is a production server API unless a production backend is separately deployed.

## How destination checks work

The destination diagnostic helper runs from the computer hosting this application. It does not run from the user's browser and does not inspect the user's Wi Fi adapter, local gateway, router configuration, or complete ISP path.

For public hostnames, the helper attempts DNS resolution. It then checks TCP connectivity and, when the connection succeeds, requests an HTTP or HTTPS response. A literal IP address does not need DNS lookup. If a check cannot run, later stages remain marked as not tested.

A successful HTTP response means a web server answered. It does not guarantee that every page or application function works. An HTTP response such as 404 still proves that a server responded to the request.

The server validates user supplied targets and blocks private or restricted destinations. The endpoint is intended for a local classroom demonstration, not unrestricted public hosting. Review the safety code and tests before exposing it to other networks.

## DNS failure demonstration

The supplied Cisco Packet Tracer file is located at:

`Network Simulation (Cisco Demo)/Scenario 1. DNS Failure Cisco Simulation.pkt`

The documented single LAN uses `192.168.0.0/24`:

- Home router LAN address: `192.168.0.1`
- Client laptop: `192.168.0.100`
- DNS server: `192.168.0.10`
- Web server: `192.168.0.20`
- DNS record: `www.example.edu` points to `192.168.0.20`

With DNS set to `192.168.0.10`, test both the domain name and the direct web server IP. Then change the laptop DNS setting to `192.168.0.99`. Domain name access should fail while direct IP access can still work. Restore DNS to `192.168.0.10` after the demonstration.

Packet Tracer must be opened manually. The website does not control the Packet Tracer application.

## Project structure

- `src/pages/LandingPage.tsx`: homepage and main actions.
- `src/pages/InvestigationPage.tsx`: destination check form and results.
- `src/pages/QuestionnairePage.tsx`: guided symptom questions.
- `src/pages/ResultPage.tsx`: questionnaire result explanation.
- `src/pages/SimulationGuidePage.tsx`: DNS scenario instructions.
- `src/engine/targetValidation.ts`: target parsing and address restrictions.
- `src/engine/mapLiveResults.ts`: maps measured checks to educational interpretation.
- `src/engine/pathFromChecks.ts`: derives network path stages from check outcomes.
- `server/investigate.ts`: diagnostic endpoint implementation.
- `server/vitePlugin.ts`: connects the endpoint to Vite.
- `src/data/scenarios.ts`: scenario definitions.
- `Network Simulation (Cisco Demo)/`: supplied Packet Tracer file.

## Current limitations

- Live checks describe the application host, not the user's device or local network.
- The network path is an explanatory view, not a capture of physical routers or hops.
- The included Packet Tracer file demonstrates DNS failure. Other failure types should not be described as verified Packet Tracer scenarios unless corresponding simulation files and expected results are added and tested.
- Automated test and build status must be established on the target machine after dependencies install.

## Local network diagnostics (new)

The investigation workspace also includes a local diagnostics panel. It reads non-internal interface addresses from Node.js `os.networkInterfaces()`, reads the default route using the host operating system's routing command, and attempts one ICMP ping to the detected gateway. It includes command output so the user can see the evidence rather than only a status badge.

A route-tracing action runs `tracert` on Windows or `traceroute` on Unix-like systems for a validated public destination. Only responding hops are visible; routers may filter probes. These local checks run on the machine hosting the Vite/Node process, so use `npm run dev` on the computer you want to inspect. If you open the site from a different computer while the server runs elsewhere, the report describes the server computer.

The interface does not log in to a router or read its internal configuration. It does not prove general internet connectivity merely because an IP address is assigned, and a failed ping is not proof of gateway failure. Route tracing requires the operating system's `tracert`/`traceroute` command to be available. On Windows, `tracert` is built in; on many Linux distributions, `traceroute` may need to be installed separately.

## Visual design

The site uses Times New Roman throughout, with muted sage, cream, pale blue and lavender accents instead of saturated blue UI colors.
