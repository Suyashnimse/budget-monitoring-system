# Project Deliverables

This document lists the submission assets for the Budget Monitoring System project.

## Checklist Status
- [x] Angular Frontend
- [x] Node.js Backend
- [x] MongoDB Atlas
- [x] Render Deployment
- [x] Vercel Deployment
- [x] Dashboard
- [x] Alerts
- [x] Reports
- [x] GitHub Repository
- [ ] PPT
- [ ] Project Report

## Notes
- Project Name: AI-Based Budget Utilization Monitoring System
- The repository is available at `https://github.com/Suyashnimse/budget-monitoring-system.git`.
- Frontend Deployment: `https://budget-monitoring-system.vercel.app`
- Backend Deployment: `https://budget-monitoring-system.onrender.com`
- Database: MongoDB Atlas
- Technology Stack: Angular, Node.js, Express.js, MongoDB
- PPT and final project report assets still need to be added to `documentation/`.

## 1. GitHub Repository
- Repository URL: `https://github.com/Suyashnimse/budget-monitoring-system.git`
- Description: Hosted source code for the frontend, backend, and documentation.

## 2. Live Frontend (Vercel)
- Frontend URL: `https://budget-monitoring-system.vercel.app`
- Notes:
  - Points to the deployed Angular frontend.
  - Verify that login, budget allocation, expense entry, dashboard, alerts, and reports pages are accessible.

## 3. Live Backend (Render)
- Backend URL: `https://budget-monitoring-system.onrender.com`
- Notes:
  - Exposes API endpoints such as `/api/budget`, `/api/expense`, `/api/department`, `/api/alerts`, and `/api/auditlogs`.
  - Confirm the backend is reachable from the frontend deployment.

## 4. MongoDB Atlas Database
- Atlas Cluster Name: `<cluster-name>`
- Connection String: `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority`
- Notes:
  - Seed sample data for departments, budgets, expenses, and users.
  - Ensure the backend uses this Atlas connection string in the `.env` file.

## 5. IEEE Report
- File Name: `documentation/IEEE_Report.pdf`
- Sections to include:
  1. Title Page
  2. Abstract
  3. Introduction
  4. Problem Statement
  5. Related Work
  6. System Architecture
  7. Implementation
  8. Results and Evaluation
  9. Conclusion and Future Work
  10. References
- Notes:
  - Follow IEEE formatting guidelines for fonts, headings, citations, and references.
  - Include diagrams for frontend/backend architecture and data flow.

## 6. PPT
- File Name: `documentation/Presentation.pptx`
- Suggested slides:
  1. Project Title and Team
  2. Motivation and Problem Statement
  3. System Overview
  4. Technology Stack
  5. Functional Modules
  6. Demo Screenshots
  7. Deployment Setup
  8. Results and Key Features
  9. Future Enhancements
  10. Q&A

## 7. Screenshots
- Suggested files:
  - `documentation/screenshots/login.png`
  - `documentation/screenshots/dashboard.png`
  - `documentation/screenshots/budget.png`
  - `documentation/screenshots/expense.png`
  - `documentation/screenshots/alerts.png`
  - `documentation/screenshots/reports.png`
- Notes:
  - Capture clear UI screenshots with meaningful data.
  - Include screenshots of live deployment pages if available.

## 8. Demo Video
- File Name: `documentation/Demo_Video.mp4`
- Suggested content:
  - Login flow
  - Creating a department
  - Creating a budget allocation
  - Adding an expense
  - Generating alerts
  - Viewing the dashboard
  - Downloading reports
  - Logout flow
- Notes:
  - Keep the video concise and polished.
  - Narrate the main features and user actions.
