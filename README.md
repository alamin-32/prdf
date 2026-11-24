# HelioQuote PRDF — Next.js Solar PV Calculator & Quotation Portal

A complete **Next.js 15 (App Router) + TypeScript + Tailwind CSS** web application for solar PV installation gear pricing, real-time A4 PDF generation, printing, and role-based Engineer & Department Head approval workflows.

## Framework & Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript / React 19
- **Styling:** Tailwind CSS 3 + A4 Print Media Queries (`app/globals.css`)
- **Icons:** Lucide React (`lucide-react`)

## Project Structure
```text
helioquote-prdf-nextjs/
├── app/
│   ├── dept-head/
│   │   └── dashboard/
│   │       └── page.tsx       # Admin Approval & Engineer Status Dashboard route
│   ├── login/
│   │   └── page.tsx           # Role-based Engineer & Admin Login route
│   ├── quotes/
│   │   └── [id]/
│   │       └── page.tsx       # Printable A4 BOQ & PDF Download route
│   ├── globals.css            # Tailwind directives + @page A4 print styles
│   ├── layout.tsx             # Root Next.js HTML layout & metadata
│   └── page.tsx               # Main Solar Gear Calculator route (/)
├── components/
│   └── HelioQuoteApp.tsx      # Full interactive client application & state provider
├── public/
│   └── favicon.svg            # Brand solar vector icon
├── .gitignore
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

## Demo Credentials
- **Engineer Login:** `engineer@prdf.com` / `eng1234`
- **Admin / Dept. Head Login:** `admin@prdf.com` / `admin1234`

## Run Locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the Next.js development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploy to GitHub & Vercel
1. Initialize a Git repository and push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: HelioQuote Next.js App"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
2. Go to [https://vercel.com/new](https://vercel.com/new), import your GitHub repository, keep the default **Next.js** framework preset, and click **Deploy**.
