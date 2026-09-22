# 🚀 GoHighLevel Centralized Operations & Analytics Dashboard

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.6-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-5.21-indigo?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql" alt="MySQL" />
  <img src="https://img.shields.io/badge/Security-AES--256--GCM-red?style=for-the-badge" alt="AES-256-GCM" />
</p>

A unified, real-time command center designed for multi-location agencies, sales teams, and enterprise operators managing **GoHighLevel (GHL)** sub-accounts. Consolidate pipelines, monitor rep performance, detect pipeline bottlenecks, and analyze lead source attribution across all accounts from a single interface.

---

## 🌟 Key Highlights & Capabilities

### 🏢 Multi-Location Architecture
* **Instant Sub-Account Switching**: Seamlessly toggle between multiple GHL sub-accounts with zero latency.
* **Encrypted Vault Storage**: HighLevel Private Integration Tokens (PIT) are encrypted at rest using industry-standard **AES-256-GCM** with unique initialization vectors and authentication tags.
* **Automated & On-Demand Sync**: Perform on-demand full syncs or let webhooks process updates in real time.

### 📊 Real-Time Executive KPI Engine
* **Instant KPI Computing**: Sub-50ms aggregated queries calculating:
  * **Total Pipeline Value** & Active Deal Volume
  * **Win Rates** and Closed Revenue
  * **Average Sales Velocity** (days to close)
  * **Conversion Drop-offs** across sales cycles
* **Dynamic Time Horizons**: Filter by *Today*, *Yesterday*, *This Week*, *This Month*, *Last Month*, *This Quarter*, or *Custom Date Ranges*, with options to filter by **Created Date** or **Won/Closed Date**.

### ⚠️ Intelligent Bottleneck Detection
* **Stalled Deal Radar**: Instantly flags high-value opportunities stuck in stages longer than predefined thresholds.
* **Stage Chokepoint Diagnostics**: Interactive bottleneck modal spotlighting specific stages where deals decelerate or drop off.

### 👤 Agent 360° Performance Matrix
* **Rep Leaderboard**: Individual sales rep tracking across active pipelines, win rates, conversion rates, and closed deal volume.
* **Agent 360 Drilldown Modal**: Deep dive into any rep's active opportunities, deal stage distribution, and velocity metrics with direct links.

### 🎯 Pipeline Velocity Funnel & Lead Source Matrix
* **Visual Conversion Funnel**: Track stage-by-stage progression and pinpoint where pipeline leakage occurs.
* **Attribution Matrix**: Cross-examine lead sources (Google Ads, Meta Ads, Referrals, Organic, Outbound) against conversion rate and revenue yield.

### 🔗 Secure Dashboard Sharing
* **Tokenized Snapshots**: Generate secure, time-limited read-only links with custom expiration to share insights with stakeholders and clients without granting CRM access.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router & Server Actions) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict typing across API and client) |
| **Database & ORM** | [MySQL 8.0+](https://www.mysql.com/) + [Prisma ORM 5](https://www.prisma.io/) |
| **Styling & UI** | [Tailwind CSS](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/) |
| **Security & Crypto** | Node.js `crypto` module (AES-256-GCM 32-byte encryption) |
| **External API** | [GoHighLevel API v2](https://marketplace.gohighlevel.com/) (`services.leadconnectorhq.com`) |

---

## 🗄️ Database Schema Overview

```mermaid
erDiagram
    GhlLocation ||--o{ Pipeline : "has"
    GhlLocation ||--o{ User : "contains"
    GhlLocation ||--o{ Contact : "manages"
    GhlLocation ||--o{ Opportunity : "owns"
    GhlLocation ||--o{ DashboardShare : "issues"
    Pipeline ||--o{ PipelineStage : "contains"
    PipelineStage ||--o{ Opportunity : "categorizes"
    User ||--o{ Opportunity : "assigned to"
    Contact ||--o{ Opportunity : "associated with"
    Opportunity ||--o{ OpportunityStageHistory : "tracks"
    Opportunity ||--o{ Task : "has"
```

The database models include:
* `GhlLocation`: Manages sub-accounts, encrypted tokens, currency, and sync statuses.
* `Pipeline` & `PipelineStage`: Tracks pipeline hierarchies and stage order.
* `Opportunity`: Real-time deal records with values, assignment, and status.
* `OpportunityStageHistory`: Historical audit trail of deal stage transitions for velocity calculation.
* `User`: Sub-account team members and sales representatives.
* `DashboardShare`: Time-bounded cryptographic share tokens for external reporting.

---

## 🏁 Getting Started

### Prerequisites
* **Node.js**: v18.18.0 or newer (v20+ recommended)
* **npm** or **pnpm** / **yarn**
* **MySQL**: Running instance (local or hosted e.g., PlanetScale, Supabase/RDS)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Haris-khan-Durrani/ghl-centralized-dashboard.git
cd ghl-centralized-dashboard
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials and secret key:
```env
# Database Connection
DATABASE_URL="mysql://root:yourpassword@localhost:3306/central_dashboard"

# AES-256-GCM 32-Byte Hex Key (Must be 64 characters)
APP_ENCRYPTION_KEY="a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90"

# Application Settings
NEXT_PUBLIC_APP_URL="http://localhost:3005"
PORT=3005
```

> **Tip:** You can generate a secure 64-character hex key using Node.js:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 3. Initialize the Database
Push the schema to your MySQL database and generate the Prisma client:
```bash
npx prisma db push
npx prisma generate
```

*(Optional)* Seed sample sub-accounts, demo pipelines, deals, and reps:
```bash
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```

Open your browser at [http://localhost:3005](http://localhost:3005) to view the dashboard!

---

## ⚙️ Connecting GoHighLevel Sub-Accounts

1. In the dashboard top-right navigation, click **Sub-Accounts Settings** (⚙️ icon).
2. Click **+ Add Sub-Account**.
3. Fill in:
   * **Location Name**: e.g., *Acme Corp - Main*
   * **Location ID**: Found in GHL under *Settings > Business Info > Relationship Number / Location ID*.
   * **Private Integration Token (PIT)**: Generated under *Settings > Developers > Private Integrations*.
   * **Currency**: e.g., `USD`, `AED`, `EUR`, `GBP`.
4. Click **Save & Sync**: The system will validate the token, encrypt it in the database, and trigger an automated fetch of users, pipelines, stages, and active opportunities.

---

## 🔄 Webhook Integration (Real-Time Sync)

To receive real-time updates when deals move or change status in GoHighLevel:
1. In GoHighLevel, navigate to **Automation > Workflows**.
2. Create a workflow triggered on:
   * **Opportunity Created**
   * **Opportunity Status Changed**
   * **Opportunity Stage Changed**
3. Add a **Webhook** action pointing to:
   ```text
   POST https://your-domain.com/api/webhooks/ghl?locationId=YOUR_LOCATION_ID
   ```
4. The dashboard will automatically update deal values, assignees, and stages in real time.

---

## 📁 Project Structure

```text
central-dashboard/
├── prisma/
│   ├── schema.prisma       # Database schema and relational definitions
│   └── seed.js             # Realistic sample data generator
├── src/
│   ├── app/
│   │   ├── api/            # API endpoints (KPIs, locations, webhooks, shares)
│   │   ├── share/          # Public read-only shareable view route
│   │   ├── globals.css     # Tailwind styling & custom utility classes
│   │   ├── layout.tsx      # Root application layout
│   │   └── page.tsx        # Main executive dashboard page
│   ├── components/
│   │   ├── dashboard/      # Metrics, Funnels, Bottlenecks, Lead Matrix, Agent Grid
│   │   ├── layout/         # Sidebar, Header, Sub-account Switchers
│   │   └── modals/         # Agent 360, Bottlenecks, Settings, Sharing modals
│   ├── context/
│   │   └── LocationContext.tsx # Global sub-account state provider
│   └── lib/
│       ├── crypto.ts       # AES-256-GCM encryption & decryption helpers
│       ├── db.ts           # Prisma database client singleton
│       ├── cache.ts        # In-memory caching for ultra-fast KPI delivery
│       ├── ghl/            # GoHighLevel API v2 client and sync service
│       └── kpi/            # SQL-optimized KPI computation logic
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── package.json            # Node dependencies and scripts
├── tailwind.config.js      # Tailwind design configuration
└── tsconfig.json           # TypeScript configuration
```

---

## 🔒 Security & Privacy

* **Key Encryption**: HighLevel Private Integration Tokens are stored exclusively as AES-256-GCM encrypted strings (`iv:ciphertext:tag`). Plaintext keys are never logged or exposed in client responses.
* **Masked Display**: Keys displayed in the UI are masked showing only the last 4 characters (`••••••••3a9f`).
* **Protected Routes**: Shared dashboard URLs use high-entropy random tokens with optional expiration dates.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs the Next.js development server on port 3005 |
| `npm run build` | Builds the application for production |
| `npm run start` | Starts the production server on port 3005 |
| `npm run lint` | Runs Next.js ESLint checks |
| `npm run db:push` | Pushes the Prisma schema directly to MySQL |
| `npm run db:seed` | Populates the database with demo sub-accounts and data |
| `npm run db:generate` | Generates the updated Prisma Client types |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to open an issue or submit a Pull Request.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
