# Deployment Guide: Next.js to Vercel

Follow these steps to deploy your KAIwa Next.js application to Vercel and generate the live preview URL required for your assignment submission.

## 1. Commit and Push to GitHub
Before deploying, make sure all your recent Next.js scaffolding changes are pushed to your GitHub repository.

```bash
git add .
git commit -m "feat: scaffold Next.js app router and placeholder pages"
git push origin main
```

> [!IMPORTANT]
> **No Secrets in Repo:** Ensure you have not hardcoded any API keys or secrets in your codebase. If you need environment variables, create a `.env.local` file (which is gitignored by default in Next.js).

## 2. Connect to Vercel
1. Go to [Vercel.com](https://vercel.com/) and log in with your GitHub account.
2. Click **Add New** > **Project**.
3. Import your `KAIwa` repository from GitHub.
4. Vercel will automatically detect that this is a **Next.js** project. The default Build Command (`next build`) and Output Directory (`.next`) are already correct.

## 3. Configure Environment Variables (If Applicable)
If your application uses external APIs (like OpenAI or Anthropic for the chat feature) and requires secrets, you must add them securely in Vercel.
- In the "Configure Project" step, expand the **Environment Variables** section.
- Add your variables (e.g., `OPENAI_API_KEY`).
- These will securely be injected during the build and runtime.

## 4. Deploy and Verify
1. Click **Deploy**. Vercel will start building your Next.js application.
2. Once the build is complete (usually 1-2 minutes), you will be presented with a **Preview URL** (e.g., `https://kaiwa-yourname.vercel.app`).
3. Click the URL to open your live application.

## 5. Evaluation Checklist
Before submitting, verify your deployment against the assignment criteria:
- [ ] **No build errors:** Your project should deploy successfully on Vercel without crashing.
- [ ] **Placeholder screens:** Check that `/`, `/dashboard`, `/chat/persona-1`, and `/health` all load correctly.
- [ ] **Responsiveness:** Open Chrome DevTools (F12), toggle the device toolbar, and verify the app looks good at **375px** (mobile) and **1280px** (desktop).
- [ ] **Data Fetching:** Visit the `/health` route and confirm the external JSONPlaceholder API data is rendering.

## 6. Submit Your Assignment
Once everything looks good, submit the following to your assignment portal:
1. **Live Preview URL:** Your Vercel deployment link.
2. **Repo Link:** Your GitHub repository URL.
