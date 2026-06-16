# Bulk File Affiliate Graphic Management

A full-stack application for bulk-uploading promotional graphics, automatically matching them to affiliates based on their coupon codes, uploading the files to AWS S3, and providing affiliates with a secure dashboard to view and download their assets.

---

## Architecture Overview

- **Backend**: Django & Django REST Framework (DRF)
  - **Database**: PostgreSQL (configured via Neon / local Postgres)
  - **File Storage**: AWS S3 (for securely hosting graphics)
  - **Documentation**: OpenAPI Swagger via `drf-spectacular`
- **Frontend**: Next.js (TypeScript, React Query, TailwindCSS, Lucide icons)
  - **Styling**: Sleek dark-themed glassmorphism interface

---

## Getting Started

### 1. Backend Setup (Django)

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Set up a Python virtual environment & install dependencies**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `backend/` directory (you can copy `.env_sample`):
   ```env
   DEBUG=True
   SECRET_KEY=your-django-secret-key

   # Database settings (Postgres)
   DB_NAME=your_db_name
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_HOST=your_db_host
   DB_PORT=5432

   # AWS S3 Settings
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_STORAGE_BUCKET_NAME=your_s3_bucket_name
   AWS_S3_REGION_NAME=your_s3_region
   ```

4. **Run Migrations**:
   ```bash
   python manage.py migrate
   ```

5. **Seed Mock Affiliates (Optional)**:
   You can populate the database with example affiliates using the mock SQL script located at `backend/examples/affiliate-mock.sql` in your PostgreSQL console, or run:
   ```bash
   python manage.py shell
   ```
   Or use Django's admin panel by creating a superuser:
   ```bash
   python manage.py createsuperuser
   ```

6. **Start the Development Server**:
   ```bash
   python manage.py runserver
   ```
   The backend API will run on `http://127.0.0.1:8000/`. You can view interactive API docs at `http://127.0.0.1:8000/api/docs/`.

---

### 2. Frontend Setup (Next.js)

1. **Navigate to the frontend directory**:
   ```bash
   cd ../frontend
   ```

2. **Install node dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Create a `.env.local` file in the `frontend/` directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Start the Next.js Development Server**:
   ```bash
   npm run dev
   ```
   The frontend application will start on `http://localhost:3000/`.

---

## Expected User Flow & Features

### Step 1: Admin Seeds Affiliates
Admin adds affiliates to the database (each affiliate has a unique `coupon_code` such as `JOHN50`, `JANESMITH10`).

### Step 2: Bulk Upload & Preview Mappings (Admin)
- Admin goes to the **Upload Graphics** page (`/admin/upload`).
- Admin drags & drops multiple files with prefixes corresponding to affiliate coupon codes (e.g., `john50_banner.png`, `janesmith10_sidebar.jpg`).
- The backend parses the filenames, matches the coupon code to the affiliate, identifies the graphic type (e.g., `banner`, `sidebar`), and displays a preview map of file name to affiliate.

### Step 3: Confirm & Bulk Save
- When Admin clicks **Confirm & Bulk Save**, the backend:
  1. Uploads the files to AWS S3.
  2. Creates records in the `AffiliateGraphic` database table.
  3. Writes audit entries into the `ActivityLog` (viewable on `/admin/graphics`).

### Step 4: Affiliate Portal
- Affiliates visit the **Affiliate Hub** (`/affiliate`).
- They can view all active promotional graphics assigned to them.
- They can select multiple files and download them securely using generated S3 presigned URLs.
