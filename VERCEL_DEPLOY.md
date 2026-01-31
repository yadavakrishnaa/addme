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
   - **Name:** `API_KEY`  
   - **Value:** your Gemini API key  
   Apply to **Production**, **Preview**, and **Development**.

5. Click **Deploy**. Your app will be at a URL like `https://addme-xxx.vercel.app`.

**Note:** Do not commit `.env` or `.env.local`; the key is set only in Vercel (and locally in `.env.local` for dev).
