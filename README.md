# ⚡ Smart Habit Execution System

An AI-powered health and habit tracking platform designed to bridge the gap between patients, doctors, and data-driven wellness. 

![Project Banner](https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80)

## 🩺 Overview

The Smart Habit Execution System is a full-stack medical wellness application that combines automated habit tracking with clinical oversight. It features personalized AI coaching, tailored exercise plans based on real medical data, and dedicated portals for patients, doctors, and administrators.

## 🚀 Key Features

### 👤 Patient Experience
- **Daily habit tracking** with smart streaks and points.
- **AI Health Coach**: Personalized advice and workout modifications based on your current mood and medical profile.
- **Medical Record Management**: Track vitals like Resting HR, BP, and Glucose levels.
- **Interactive Calendar**: Visual representation of habit consistency and history.
- **Social & Gamification**: Leaderboards, levels, and badges to keep you motivated.

### 🩺 Doctor Portal
- **Patient Management**: Complete view of patient clinical data and vitals.
- **AI-Prescribed Plans**: Generate and approve AI-driven exercise routines tailored to specific conditions.
- **Clinical Notes**: Securely add and update medical notes and restrictions.

### 🛡️ Admin Portal
- **Performance Analytics**: Platform-wide statistics on user engagement and habit completion.
- **Role Management**: Control system-wide user roles and permissions.

### 🚨 Advanced Modules
- **Critical Vital Alerts**: An automated notification system that alerts doctors when a patient's recorded vitals fall outside of doctor-defined safety thresholds. Transforms the platform from a passive tracker into a proactive medical safety tool.
- **AI Clinical Trend Summaries**: A feature for the doctor portal that uses AI to synthesize a patient's recent vitals and habit data into a concise text summary. Helps doctors quickly identify patterns and risks.
- **Medication Adherence Module**: A specialized logging tool for patients to record medication intake, integrated with their daily habit streaks.

## 🛠️ Technology Stack

- **Frontend**: 
  - [React.js](https://reactjs.org/) + [Vite](https://vitejs.dev/)
  - [Framer Motion](https://www.framer.com/motion/) (Animations)
  - [Zustand](https://github.com/pmndrs/zustand) (State Management)
  - [React Router](https://reactrouter.com/) (Routing)
  - [Vanilla CSS](https://developer.mozilla.org/en-US/docs/Web/CSS) (Glassmorphism UI)
- **Backend**: 
  - [Django](https://www.djangoproject.com/) + [DRF](https://www.django-rest-framework.org/)
  - [JWT](https://jwt.io/) (Authentication)
  - [SQLite](https://sqlite.org/) (Database)
- **AI Engine**: 
  - [Groq AI](https://groq.com/) (Llama 3.3 70B Model)

## 🏁 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Environment Variables
Create a `.env` file in the `frontend` folder:
```env
VITE_GROQ_API_KEY=your_key_here
```

## 📄 License
This project is for educational and hackathon purposes.

---
Built with ❤️ by [Sanjay Kumar](https://github.com/SanjayKumar-sg)
