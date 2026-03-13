# Supabase Setup Guide

This guide walks you through creating the Supabase database for the **Healthy Sunshine Melbourne** project and seeding it with the Melbourne 2024 UV data.

---

## Step 1 — Create a Supabase Account and Project

1. Go to [https://supabase.com](https://supabase.com) and sign up for a free account.
2. After logging in, click **New Project**.
3. Fill in:
   - **Name:** `healthy-sunshine` (or any name you like)
   - **Database Password:** choose a strong password and save it somewhere
   - **Region:** `Southeast Asia (Singapore)` or `Northeast Asia (Tokyo)` — closest to Melbourne
4. Click **Create new project** and wait about 1–2 minutes for it to provision.

---

## Step 2 — Create the Table

1. In the left sidebar, click **SQL Editor**.
2. Click **New query**.
3. Paste the following SQL and click **Run** (▶):

```sql
CREATE TABLE uv_melbourne_2024 (
  id      BIGSERIAL PRIMARY KEY,
  date    DATE         NOT NULL,
  month   SMALLINT     NOT NULL,
  day     SMALLINT     NOT NULL,
  hour    SMALLINT     NOT NULL,
  avg_uvi NUMERIC(5,2) NOT NULL,
  UNIQUE(date, hour)
);
```

You should see `Success. No rows returned` in the results panel.

---

## Step 3 — Get Your API Keys

1. In the left sidebar, click **Project Settings** (gear icon at the bottom).
2. Click **API** in the settings menu.
3. Copy the following two values — you will need them in the next step:
   - **Project URL** — looks like `https://abcdefghijkl.supabase.co`
   - **anon public** key — a long string starting with `eyJ...`

---

## Step 4 — Add Keys to Your .env File

Open the `.env` file in the project root and add these two lines:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the values with what you copied in Step 3.

---

## Step 5 — Seed the Database

Run the seed script from the project root. It reads `data/uv-melbourne-2024.csv`, keeps only the reading at the top of each hour (`:00:00`), and uploads 8,784 rows (366 days × 24 hours) to Supabase.

```bash
npm run seed:supabase
```

Expected output:

```
Reading CSV…
Parsed 526969 data rows → 8784 hourly readings kept
Uploading 8784 rows to Supabase…
  8784/8784 rows uploaded…
✓ Done. 8784 rows in uv_melbourne_2024.
```

This takes about 1–3 minutes depending on your internet connection.

---

## Step 6 — Verify the Data

1. Go back to Supabase dashboard.
2. In the left sidebar, click **Table Editor**.
3. Select the `uv_melbourne_2024` table.
4. You should see rows like:

| date       | month | day | hour | avg_uvi |
|------------|-------|-----|------|---------|
| 2024-01-01 | 1     | 1   | 0    | 0.01    |
| 2024-01-01 | 1     | 1   | 12   | 8.45    |
| ...        | ...   | ... | ...  | ...     |

---

## Step 7 — Run the App

Start both the frontend and backend together:

```bash
npm run dev:all
```

- Vue frontend: [http://localhost:5173](http://localhost:5173)
- Express API: [http://localhost:3001](http://localhost:3001)

On the **UV Today** page, after fetching your location's UV, the historical card will show:
- The UV reading at the **same hour on the same calendar day in 2024** for Melbourne
- A comparison badge (Higher / Lower / Similar to 2024)
- A monthly bar chart of Melbourne's 2024 UV pattern

---

## If You Need to Re-seed

If you need to reset and re-seed (e.g. after changing the schema):

**In Supabase SQL Editor, run:**
```sql
DROP TABLE IF EXISTS uv_melbourne_2024;

CREATE TABLE uv_melbourne_2024 (
  id      BIGSERIAL PRIMARY KEY,
  date    DATE         NOT NULL,
  month   SMALLINT     NOT NULL,
  day     SMALLINT     NOT NULL,
  hour    SMALLINT     NOT NULL,
  avg_uvi NUMERIC(5,2) NOT NULL,
  UNIQUE(date, hour)
);
```

**Then run the seed script again:**
```bash
npm run seed:supabase
```

---

## Data Source

| Field | Details |
|-------|---------|
| Dataset | UV Index — Melbourne 2024 |
| Source | ARPANSA / Data.gov.au |
| File | `data/uv-melbourne-2024.csv` |
| Resolution | 1 minute (only top-of-hour readings used) |
| Rows in DB | 8,784 (366 days × 24 hours) |
| Licence | Creative Commons Attribution 2.5 Australia |
| Link | https://data.gov.au/data/organization/australia |
