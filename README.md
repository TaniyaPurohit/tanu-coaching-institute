# 🎓 EduTrack – Coaching Institute Management System

> A comprehensive web application for managing every day-to-day operation of a coaching institute: student admissions, batch scheduling, attendance, fee collection with printable receipts, test analytics, and a built-in Gemini AI assistant.

**🌐 Live Demo:** [https://tanu-coaching-institute.netlify.app](https://tanu-coaching-institute.netlify.app)
**📦 Repository:** [github.com/TaniyaPurohit/tanu-coaching-institute](https://github.com/TaniyaPurohit/tanu-coaching-institute)

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Deployed on](https://img.shields.io/badge/deployed%20on-Netlify-00C7B7)
![AI](https://img.shields.io/badge/AI-Gemini-4285F4)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 📑 Table of Contents

1. [About the Project](#-about-the-project)
2. [Problem Statement](#-problem-statement)
3. [Key Features](#-key-features)
4. [Tech Stack](#-tech-stack)
5. [Project Structure](#-project-structure)
6. [Getting Started](#-getting-started)
7. [Environment Variables](#-environment-variables)
8. [Usage Guide](#-usage-guide)
9. [Module Walkthrough](#-module-walkthrough)
10. [Gemini AI Assistant](#-gemini-ai-assistant)
11. [Deployment](#-deployment)
12. [Screenshots](#-screenshots)
13. [Roadmap](#-roadmap)
14. [Contributing](#-contributing)
15. [License](#-license)
16. [Author](#-author)

---

## 📖 About the Project

**EduTrack** is a management platform built for coaching institutes and tuition centres. Running a coaching institute usually means juggling paper registers, spreadsheets, WhatsApp groups, and handwritten fee receipts. EduTrack brings all of this into one clean dashboard so that administrators and teachers can spend less time on paperwork and more time teaching.

## 🎯 Problem Statement

Small and mid-sized coaching institutes commonly face:

- Student records scattered across notebooks and spreadsheets
- Manual attendance that is slow and error-prone
- Missed or untracked fee payments and no proper receipts
- No easy way to analyse test performance across batches
- Time wasted answering repetitive queries and drafting messages

EduTrack addresses each of these with a dedicated module, all accessible from a single web app.

---

## ✨ Key Features

| Module | What it does |
|---|---|
| 🧑‍🎓 **Student Admissions** | Register new students, store their details, and assign them to batches |
| 🗓️ **Batch Scheduling** | Create batches, set timings and subjects, and manage the weekly schedule |
| ✅ **Attendance Tracking** | Mark daily attendance per batch and review attendance history |
| 💰 **Fee Collection** | Record payments, track dues and pending fees |
| 🧾 **Printable Receipts** | Generate clean, print-ready fee receipts for every payment |
| 📊 **Test Analytics** | Record test scores and view performance insights by student and batch |
| 🤖 **Gemini AI Assistant** | Ask questions, get summaries, and draft content using Google's Gemini |

---

## 🛠️ Tech Stack

<!-- VERIFY: Update this table to match what the repository actually uses. -->

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript (single-page app) |
| AI Integration | Google Gemini API |
| Hosting | Netlify |
| Version Control | Git & GitHub |

> If the project uses a framework or library (for example React, Vite, Tailwind CSS, or Chart.js), add it to the table above.

---

## 📂 Project Structure

<!-- VERIFY: Replace with the real folder layout from the repo. -->

```
tanu-coaching-institute/
├── public/              # Static assets
├── src/                 # Application source code
│   ├── components/      # UI components
│   ├── pages/           # Admissions, Batches, Attendance, Fees, Tests, AI
│   ├── services/        # Gemini API and data helpers
│   └── styles/          # Stylesheets
├── index.html           # App entry point
├── package.json         # Dependencies and scripts
├── .env.example         # Example environment variables
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later and npm <!-- VERIFY: remove if the project has no build step -->
- A [Google Gemini API key](https://aistudio.google.com/app/apikey) (for the AI assistant)
- Git

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/TaniyaPurohit/tanu-coaching-institute.git

# 2. Move into the project folder
cd tanu-coaching-institute

# 3. Install dependencies
npm install

# 4. Create your environment file
cp .env.example .env
# then add your Gemini API key (see below)

# 5. Start the development server
npm run dev
```

Open the local URL printed in your terminal (usually `http://localhost:5173` or `http://localhost:3000`).

### Production build

```bash
npm run build
npm run preview
```

---

## 🔐 Environment Variables

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

<!-- VERIFY: Use the exact variable name the code reads (for example VITE_GEMINI_API_KEY). -->

> ⚠️ **Never commit your `.env` file or API key to GitHub.** Make sure `.env` is listed in `.gitignore`. For production, consider calling Gemini through a server-side function (such as a Netlify Function) so the key is not exposed in browser code.

---

## 📘 Usage Guide

1. **Add batches** first (for example "Class 10 – Maths, Mon/Wed/Fri 5 PM").
2. **Admit students** and assign each one to a batch.
3. **Mark attendance** each day for the relevant batch.
4. **Collect fees** and print a receipt for the student or parent.
5. **Record test scores** after each test and review the analytics.
6. **Ask the AI assistant** for help with summaries, reminders, or drafting notices.

---

## 🧩 Module Walkthrough

### 1. Student Admissions
Capture student name, contact details, guardian information, course or class, and the assigned batch. Records can be viewed, searched, and updated.

### 2. Batch Scheduling
Define batches with subject, teacher, days, and timings. See the full schedule at a glance and avoid clashes.

### 3. Attendance Tracking
Pick a batch and date, mark each student present or absent, and save. Review past attendance to spot irregular students early.

### 4. Fee Collection & Receipts
Log each payment with amount, date, and mode. Outstanding balances are visible per student. Every payment can be turned into a **printable receipt** (use the browser's *Print* or *Save as PDF* option).

### 5. Test Analytics
Enter marks for each test and view results by student and batch, such as averages, top performers, and students who need extra attention.

### 6. Dashboard
A summary view of key numbers such as total students, active batches, today's attendance, and fees collected or pending. <!-- VERIFY: confirm dashboard contents -->

---

## 🤖 Gemini AI Assistant

EduTrack includes an AI assistant powered by **Google Gemini**. Example uses:

- "Summarise the attendance of Batch A this week."
- "Draft a polite fee reminder message for parents."
- "Suggest a revision plan for students who scored below 40%."
- "Write a notice about tomorrow's holiday."

The assistant helps with productivity and drafting. Always review AI-generated content before sending it to students or parents.

---

## ☁️ Deployment

The app is deployed on **Netlify**.

To deploy your own copy:

1. Fork this repository.
2. Log in to [Netlify](https://www.netlify.com/) and choose **Add new site → Import an existing project**.
3. Connect your GitHub fork.
4. Set the build command and publish directory <!-- VERIFY: e.g. `npm run build` and `dist` -->.
5. Add `GEMINI_API_KEY` under **Site settings → Environment variables**.
6. Click **Deploy site**.

---

## 🖼️ Screenshots

<!-- Add screenshots to a /screenshots folder and reference them here. -->

| Dashboard | Admissions |
|---|---|
| ![Dashboard](screenshots/dashboard.png) | ![Admissions](screenshots/admissions.png) |

| Attendance | Fee Receipt |
|---|---|
| ![Attendance](screenshots/attendance.png) | ![Receipt](screenshots/receipt.png) |

---

## 🗺️ Roadmap

- [ ] User authentication with admin, teacher, and student roles
- [ ] Cloud database for persistent, multi-device data
- [ ] SMS / WhatsApp / email reminders for fees and absences
- [ ] Student and parent portal
- [ ] Export reports to Excel and PDF
- [ ] Online fee payment integration
- [ ] Dark mode and multi-language support

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the project
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please keep code clean and describe your changes clearly in the PR.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details. <!-- VERIFY: add a LICENSE file or change this -->

---

## 👩‍💻 Author

**Taniya Purohit**
GitHub: [@TaniyaPurohit](https://github.com/TaniyaPurohit)

---

⭐ If you found this project useful, please consider giving it a star!
