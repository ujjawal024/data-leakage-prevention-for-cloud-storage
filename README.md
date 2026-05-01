# Data Leakage Prevention for Cloud Storage

A full-stack application that detects and prevents leakage of sensitive data in files uploaded to a cloud storage system.

---

## Features

* File upload with automated scanning
* Detection of sensitive data (e.g., PII, API keys)
* Data classification (Restricted, Confidential, Public)
* Access control based on classification
* Activity logs and alerts dashboard
* User authentication (login/register)

---

## Tech Stack

**Frontend**

* React (Vite)
* Tailwind CSS
* Axios

**Backend**

* Flask (Python)
* REST API

---

## Project Structure

```
dlp-system/
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── package.json
├── backend/
├── workflow.txt
├── .gitignore
└── README.md
```

---

## Getting Started

### Clone the repository

```
git clone https://github.com/ujjawal024/data-leakage-prevention-for-cloud-storage.git
cd data-leakage-prevention-for-cloud-storage
```

---

### Frontend setup

```
cd dlp-system/frontend
npm install
npm run dev
```

---

### Backend setup

```
cd dlp-system/backend
pip install -r requirements.txt
python app.py
```

---

## Usage

1. Start backend server
2. Start frontend application
3. Open the app in browser
4. Upload files to scan and classify
5. View alerts and logs from dashboard

---

## Configuration

Create a `.env` file if required for:

* API URLs
* Secret keys

---

## Notes

* `node_modules/` is ignored via `.gitignore`
* Install dependencies locally using `npm install`

---

## License

This project is for educational purposes.
