# CampusOps — Facility Complaint and Service Request System
Initial prototype repository for **CampusOps** (Case 4), designed for the Campus Facilities Unit to manage facility complaint submissions, validation, priority assignment, technician task tracking, and repair resolution logs.

## Core MVP Scope
- **Complaint Submission:** Structured complaint creation (`title`, `location`, `category`, `description`) with a unique auto-generated `Ticket ID` (`TCK-YYYY-XXXX`) and initial `Open` status.
- **Staff Triage & Updates:** Priority setting (`Low`, `Medium`, `High`), technician/PIC assignment, status transitions (`Open`, `In Progress`, `Resolved`, `Closed/Rejected`), and repair/resolution notes.
- **Core Entities:** `users`, `facility_categories`, `complaints`, and `ticket_logs`.

## Repository Structure
- `package.json` — Node.js project configuration and start script
- `.env.example` — Sample environment variables
- `src/data/store.js` — Initial seed data and in-memory store for the prototype
- `src/server.js` — Lightweight HTTP server and REST endpoints (`/api/health`, `/api/tickets`, `/api/tickets/:id`)

## Running the Prototype Locally
1. Copy `.env.example` to `.env` if needed (defaults to `PORT=3000`).
2. Start the server:
   ```bash
   npm start
