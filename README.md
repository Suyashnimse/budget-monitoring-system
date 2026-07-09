# Budget Monitoring System

A full-stack budget monitoring application with an Angular frontend and a Node.js/Express backend. It supports budget allocation, expense tracking, department management, alerts, reports, audit logs, and file uploads.

## Project Structure

- frontend/ - Angular application
- backend/ - Express API and MongoDB integration
- documentation/ - project documentation and notes

## Features

- User authentication and role-based access
- Budget allocation management
- Expense entry and tracking
- Department management
- Alerts and reports
- Audit logging
- File upload support

## Getting Started

### Backend

```bash
cd backend
npm install
node server.js
```

### Frontend

```bash
cd frontend
npm install
ng serve
```

## Environment

Create a `.env` file in the backend folder with values for:

- `MONGO_URI`
- `PORT`
- `JWT_SECRET`

## Notes

This project is intended as a coursework or prototype-level budget monitoring system and can be extended with richer reporting and authorization rules.
