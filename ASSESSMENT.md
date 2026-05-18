# Induction Dashboard — Take-Home Assignment

## Guidelines

- Timebox to 1-2 hours. It's fine to leave things incomplete — just note what you'd do next.
- Usage of AI is permitted and encouraged.
- Don't call the company and induction service directly from the client. All API calls must go through the gateway.
- No auth required. Hardcode a userId in any associated user-scoped queries or tables.

## Background

Our company provides visitor and contractor management software. When someone arrives at a site, they complete an "induction" — a series of safety questions and compliance checks before they're allowed entry.

We have two backend services that store this data:

- **Company Service** — stores information about the companies our visitors work for
- **Induction Service** — stores induction templates and the records of people who have completed them

In addition we have a placeholder service and react app ready to be built:

- **Gateway Service** - Placeholder service, all client requests must pass through this service.
- **Dashboard** - Placeholder react app

## The Task

Site administrators need a dashboard to monitor induction activity. Today, they have no easy way to. Your task is to build an induction dashboard. This dashboard should

- List all of the inductions with a count of pending induction records for each induction
- Allow selecting an induction and showing all associated records with corresponding company details
- The list of induction records should support 
  - Sorting
  - Filtering
  - Searching on first name, last name, and company name
- The sort and filter should be saved as a user preference into the database

## Getting Started

See the [README](./README.md) for setup instructions, existing API documentation, and database schema.
