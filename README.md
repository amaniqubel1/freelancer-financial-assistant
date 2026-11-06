# FreelanceFlow – Freelancer Financial Assistant

A full-stack web app that helps freelancers, consultants and independent contractors manage contracts, invoices, expenses, taxes and cash flow in one simple place.

**Live demo:** https://amaniqubel1.github.io/freelancer-financial-assistant/

## Features
- Sign up / log in with two roles: **Freelancer** and **Accounting partner** (read-only access to freelancers who invite them)
- Clients and contracts with billing progress
- Invoices: create, view on screen, download as PDF, automatic overdue detection, copy-ready payment reminder
- Expense tracking by category with tax-deductible flag
- Dashboard: income vs expenses chart, 3-month cash flow forecast, expense breakdown, overdue list
- Tax summary: financial-year / calendar-year view, quarterly breakdown, estimated tax, CSV export
- Document upload (drag and drop, categories, preview, download) in private storage
- INR and USD support
- Animations: page transitions, scroll reveals, animated counters (Framer Motion)

## Tech stack
Next.js 14 (React, static export) · Tailwind CSS · Framer Motion · Recharts · jsPDF · Supabase (PostgreSQL, Auth, Storage, Row Level Security) · GitHub Pages

## Business model
Freemium for individuals, premium subscription for unlimited invoices and forecasting, and referral/partner revenue from accountants and freelancer platforms.

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000. The Supabase URL and public (publishable) key are in `.env`.

## How the data is protected
Every table uses Row Level Security: users can only read and write their own rows, and invited accounting partners get read-only access via a `partner_access` table.

## Deployment
Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the static site and publishes it to GitHub Pages.
