# Shuttle CRM Workspace

A robust, highly practical SaaS CRM dashboard designed for sales teams, featuring comprehensive lead tables, pipelines, and task management built on Next.js 15, React 19, Tailwind CSS, and TypeScript.

---

## ⚡ Vercel Deployment Guide

Shuttle CRM is fully compatible with Vercel out of the box. Follow these simple steps to deploy:

### 1. Simple GitHub Import (Recommended)

1. Push your CRM code repository to **GitHub**, **GitLab**, or **Bitbucket**.
2. Go to the [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New"** > **"Project"**.
3. Import your repository.
4. Vercel will automatically detect `Next.js` as the framework preset and configure the optimal build command (`npm run build`) and output directory.

### 2. Configure Environment Variables

Before clicking **Deploy**, make sure to add the following environment variables in Vercel's setup step:

| Variable Name | Description | Example / Note |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Your Google Gemini API Key for server-side operations | Get one from [Google AI Studio](https://aistudio.google.com/) |
| `APP_URL` | The domain name of your deployed Vercel application | `https://your-app.vercel.app` (Can be updated after deploy) |

> ⚠️ **Security Reminder**: `GEMINI_API_KEY` is a server-side-only variable. It is **not** prefixed with `NEXT_PUBLIC_`, ensuring it remains secure and is never exposed to the client browser.

### 3. Deploy using Vercel CLI (Alternative)

If you prefer deploying via terminal, run the following commands:

```bash
# Install Vercel CLI globally
npm install -g vercel

# Run alignment deploy command
vercel
```

---

## 🛠️ Tech Stack & Engineering Highlights

- **Framework**: [Next.js 15+](https://nextjs.org/) App Router (React Server/Client architecture).
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) utility classes for pristine visual consistency.
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) combined with [Zod](https://zod.dev/) validation.
- **Type Safety**: Full TypeScript integration for strict type verification and clean data models.
- **Exclusion Management**: Pre-configured `.gitignore` prevents dynamic build folder (`.next/`) caches from cluttering your repository.
