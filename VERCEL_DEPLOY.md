# Deploy this project to Vercel

The repo is already pushed to GitHub. Complete deployment from the Vercel dashboard:

1. **Sign in:** Go to [vercel.com](https://vercel.com) and sign in with **Continue with GitHub**.

2. **Import project:** **Add New… → Project** → select **yadavakrishnaa/addme** (or paste `https://github.com/yadavakrishnaa/addme`).

3. **Configure build** (Vercel usually detects Vite):
   - **Framework Preset:** Vite  
   - **Build Command:** `npm run build`  
   - **Output Directory:** `dist`  
   - **Install Command:** `npm install`

4. **Set the API key:** In **Environment Variables** add:
   - **Name:** `VITE_API_KEY`  
   - **Value:** your Gemini API key  
   Apply to **Production**, **Preview**, and **Development**. Then **redeploy** so the build picks it up.

5. Click **Deploy**. Your app will be at a URL like `https://addme-xxx.vercel.app`.

**Note:** Do not commit `.env` or `.env.local`. For local dev, add `VITE_API_KEY=your-key` to `.env.local`.

---

## Still seeing 404 for index.css, "API Key must be set", or 401 on manifest?

Your live site is likely serving an **old deployment**. Do this:

1. **Redeploy from the latest code**
   - In Vercel: **Deployments** → open the **⋮** menu on the latest deployment → **Redeploy** (or push a new commit to `main` to trigger a build).
   - Ensure the deployment is from commit **"Fix Tailwind, index.css, API key (VITE_API_KEY), manifest, meta"** or later.

2. **Set the API key and redeploy again**
   - **Project → Settings → Environment Variables**
   - Add **`VITE_API_KEY`** with your Gemini API key.
   - Enable it for **Production** (and **Preview** if you use preview URLs).
   - Save, then **Deployments → ⋮ → Redeploy** so the new build has the key.

3. **Use the Production URL**
   - Preview URLs like `addmevercel-xxxx-yadavas-projects.vercel.app` can require login (causing 401 on manifest and other assets). Use the main project URL (e.g. **https://addmevercel.vercel.app** or whatever your Production domain is) from **Project → Settings → Domains**.

4. **If preview deployments return 401**
   - **Project → Settings → Deployment Protection** → turn off **Vercel Authentication** for Preview if you want manifest and assets to load without logging in.
