# Smart Tracker: Platform Workflow Documentation

This document outlines the operational flow and security architecture of the Smart Tracker AI-Powered Health Platform.

## 👥 User Roles & Access Control

The platform enforces a strict separation of concerns via role-based access control (RBAC):

| Role | Primary Panel | Access Restrictions |
| :--- | :--- | :--- |
| **Patient** | `/dashboard` | View only medical records; cannot create custom goals/tasks. |
| **Doctor** | `/portal/doctor` | Manage all patient clinical data; approve AI exercise plans. |
| **Admin** | `/portal/admin` | Global platform oversight; filtered out of doctor patient lists. |

> [!IMPORTANT]
> **Security Enforcement**: If a user attempts to access a portal route not assigned to their role (e.g., a Patient navigating to `/portal/doctor`), the system will automatically **Logout** the user and redirect them to the `/login` page to prevent unauthorized data exposure.

---

## 🏥 Clinical Workflow

### 1. Medical Record Management
- **Patients**: Can view their clinical data (Conditions, Allergies, Vitals) in the **Medical Record** section. Fields are read-only to ensure data integrity.
- **Doctors**: Manage patient records through the **Doctor Portal**. They can edit vitals (BP, Heart Rate), update conditions, and add clinical notes that inform the AI Coach.

### 2. AI-Doctor Exercise Approval
To ensure medical safety, all AI-generated exercise plans follow a formal approval process:
1. **Request**: A patient triggers an "AI Plan Upgrade" analysis based on their current vitals.
2. **Proposal**: The AI generates a routine, but it is saved as a **Pending Proposal**.
3. **Validation**: The Doctor sees a "Pending AI Proposal" alert in their portal for that specific patient.
4. **Prescription**: The Doctor reviews the AI's logic and clicks **"Confirm & Prescribe"**. 
5. **Activation**: The routine becomes active on the patient's dashboard, allowing them to integrate the moves into their daily tasks.

---

## 🚀 Daily User Journey (Patient)

### 📈 Dashboard & Progress
- **Habit Tracking**: Patients complete daily habits (e.g., hydration, morning stretch).
- **Progress Ring**: Displays real-time completion percentage of the day's tasks.
- **AI Mood Adaptation**: Patients can select their current mood (e.g., Tired, Energetic) to receive a one-off AI-adapted routine for that moment.

### 📅 Routine Consistency
- **Calendar**: Provides a month-view heatmap of habit consistency.
- **Insights**: AI-driven analysis of weekly progress and energy levels.

---

## 🤖 AI Coach Interaction
- **Multilingual Support**: The AI Coach speaks and responds in multiple languages (English, Tamil, etc.).
- **Dynamic Guidance**: The coach uses browser Text-to-Speech (TTS) to provide encouragement and instructions using native regional voices.
