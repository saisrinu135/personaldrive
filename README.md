# ☁️ CloudVault — Personal Cloud Storage Manager

CloudVault is a **self-hosted personal cloud storage manager** that lets you connect your own S3-compatible storage buckets (AWS S3, Cloudflare R2, MinIO, etc.) and manage all your files through a clean, modern web interface — installable as a standalone app on any device.

No third-party cloud service stores your data. Your files go directly to storage providers you own and control.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🗂 **File Management** | Upload, download, preview, and delete files across multiple storage providers |
| 🔌 **Multi-Provider Support** | Connect multiple S3-compatible buckets (AWS S3, Cloudflare R2, MinIO, Backblaze B2, etc.) |
| 📊 **Storage Analytics** | Per-provider usage stats, file counts, and storage metrics |
| 🔐 **Authentication** | JWT-based auth with access & refresh tokens |
| 📁 **Folder Navigation** | Browse files by folder path within a bucket |
| 🔍 **Search** | Search files by name across all connected providers |
| 📱 **PWA** | Installable as a standalone mobile/desktop app via Chrome — no app store needed |
| 🌙 **Dark / Light Mode** | System-aware theme with manual toggle |
| 🔒 **Encrypted Credentials** | Provider credentials are encrypted at rest in the database |

---

## 🏗 Architecture

```
cloud-storage/
├── backend/          # FastAPI (Python) REST API
│   ├── app/
│   │   ├── api/v1/routes/   # auth, user, provider, objects
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── services/        # Business logic layer
│   │   ├── core/            # Auth, dependencies
│   │   └── config/          # Settings, logging
│   ├── alembic/             # Database migrations
│   └── requirements.txt
│
├── frontend/         # Next.js 16 (TypeScript) SPA + PWA
│   ├── src/app/      # App Router pages (login, register, dashboard)
│   ├── src/components/
│   ├── src/services/ # API client functions
│   ├── src/contexts/ # Auth context
│   └── public/       # PWA manifest, icons, service worker
│
└── docker-compose.yml  # Full-stack orchestration
```

**Tech Stack**

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | FastAPI, SQLAlchemy 2, Alembic, Pydantic v2, Python-Jose (JWT) |
| Database | PostgreSQL 17 |
| Storage | AWS S3 / S3-compatible via boto3 |
| Containerisation | Docker, Docker Compose |

---

## 🚀 Getting Started

### Prerequisites

Make sure the following are installed on your machine:

- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/get-started) & Docker Compose (v2+)
- [Node.js](https://nodejs.org/) 20+ *(only needed for local frontend dev)*
- [Python](https://www.python.org/) 3.11+ *(only needed for local backend dev)*

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/cloud-storage.git
cd cloud-storage
```

---

### 2. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and set your values. See `.env.example` for all the required variables and their descriptions. Key things to configure:

- **Database credentials** — PostgreSQL username, password, and database name
- **JWT secrets** — a long random string for `SECRET_KEY` and an `ENCRYPTION_KEY` (must be 32 characters)
- **CORS origins** — add the URL where your frontend will be served
- **Frontend API URL** — the URL of your backend (e.g. `http://localhost:8000/api`)

> ⚠️ Never commit your `.env` file. It is already listed in `.gitignore`.

---

### 3. Run with Docker Compose *(Recommended)*

This starts PostgreSQL, pgAdmin, the FastAPI backend, and the Next.js frontend in one command:

```bash
docker compose up --build
```

Once running, the services are available at:

| Service | URL |
|---|---|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:8001 |
| API Docs (Swagger) | http://localhost:8001/docs |
| API Docs (ReDoc) | http://localhost:8001/redoc |
| pgAdmin | http://localhost:5050 |

To run in the background:

```bash
docker compose up --build -d
```

To stop everything:

```bash
docker compose down
```

To stop and remove all data volumes (⚠️ this deletes your database):

```bash
docker compose down -v
```

---

### 4. Run Locally (Without Docker)

#### Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate       # Linux/macOS
.venv\Scripts\activate          # Windows

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API is now at `http://localhost:8000`.

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy environment config
cp .env.example .env.local
# Edit .env.local and set NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Start the development server
npm run dev
```

The app is now at `http://localhost:3000`.

---

## 📱 Installing as a Standalone App (PWA)

CloudVault is a Progressive Web App — you can install it on your device so it opens like a native app, without a browser tab or address bar.

**On Desktop (Chrome / Edge):**
1. Open the app in Chrome
2. Click the **install icon** (⊕) in the address bar, or open the browser menu → *Install CloudVault*
3. Click **Install**
4. The app will open in its own window and appear in your taskbar / app launcher

**On Android (Chrome):**
1. Open the app in Chrome
2. Tap the browser menu (⋮) → **Add to Home screen**
3. Tap **Add**
4. The app icon appears on your home screen and opens in full-screen mode

**On iOS (Safari):**
1. Open the app in Safari
2. Tap the **Share** button → **Add to Home Screen**
3. Tap **Add**

---

## 📖 Using the Application

### Registration & Login

1. Navigate to the app and click **Register**
2. Create your account with a name, email, and password
3. You'll be redirected to the **Dashboard** after logging in

### Connecting a Storage Provider

A *provider* is an S3-compatible bucket you own. You must add at least one before uploading files.

1. In the Dashboard, click **Add Provider**
2. Enter a display name for this provider
3. Fill in your S3 credentials:
   - **Endpoint URL** — e.g. `https://s3.amazonaws.com` for AWS, or your custom endpoint for R2/MinIO
   - **Access Key ID** and **Secret Access Key** — from your cloud provider's IAM/API keys page
   - **Bucket Name** — the name of your existing bucket
   - **Region** — e.g. `us-east-1`
4. Click **Test Connection** to verify the credentials work
5. Click **Save** to store the provider

> Your credentials are encrypted before being saved to the database.

### Uploading Files

1. Select a provider from the sidebar or dropdown
2. Click **Upload** and choose one or more files
3. Optionally type a **folder path** (e.g. `photos/2024`) to organise files into sub-folders
4. The file is uploaded directly to your bucket

### Browsing & Managing Files

- Use the **search bar** to find files by name
- Click a file to see its details
- Click **Download** to save a file to your device
- Click **Preview** to open images and documents inline
- Click **Delete** to permanently remove a file from your bucket

### Storage Stats

The Dashboard shows a summary of:
- Total files and total storage used
- Per-provider breakdown of file count and storage consumed

---

## 🛠 Development

### Backend API Reference

Interactive API documentation is auto-generated by FastAPI:

- **Swagger UI** → `http://localhost:8000/docs`
- **ReDoc** → `http://localhost:8000/redoc`

### Database Migrations

After making changes to SQLAlchemy models:

```bash
cd backend

# Generate a new migration
alembic revision --autogenerate -m "describe your change"

# Apply migrations
alembic upgrade head

# Roll back one step
alembic downgrade -1
```

### Frontend Scripts

```bash
npm run dev        # Start dev server with hot reload
npm run build      # Build for production
npm run start      # Run the production build locally
npm run lint       # Run ESLint
npm run test       # Run unit tests (Vitest)
npm run test:watch # Run tests in watch mode
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "feat: add my feature"`
4. Push to your fork: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is open-source. See [LICENSE](LICENSE) for details.
