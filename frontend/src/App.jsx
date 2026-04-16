import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useStore } from './store/useStore';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import DoctorLogin from './pages/DoctorLogin';
import AdminLogin from './pages/AdminLogin';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Goals from './pages/Goals';
import Insights from './pages/Insights';
import AICoach from './pages/AICoach';
import Analytics from './pages/Analytics';
import Social from './pages/Social';
import Profile from './pages/Profile';
import MedicalRecord from './pages/MedicalRecord';
import Calendar from './pages/Calendar';
import Settings from './pages/Settings';
import DoctorPortal from './pages/portals/DoctorPortal';
import PatientPortal from './pages/portals/PatientPortal';
import AdminPortal from './pages/portals/AdminPortal';

function RoleRoute({ children }) {
  const { isAuthenticated } = useStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, role } = useStore();
  if (isAuthenticated) {
    if (role === 'doctor') return <Navigate to="/portal/doctor" replace />;
    if (role === 'admin') return <Navigate to="/portal/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  const theme = useStore(s => s.theme);
  const language = useStore(s => s.language);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    // Auto-trigger Google Translate wrapper if available
    const applyTranslation = () => {
      const select = document.querySelector('.goog-te-combo');
      if (select && select.value !== language) {
        select.value = language;
        select.dispatchEvent(new Event('change'));
      }
    };
    applyTranslation();
    setTimeout(applyTranslation, 1000); // Retry after element initializes
    setTimeout(applyTranslation, 3000);
  }, [language]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            fontSize: '0.875rem',
          },
          success: { iconTheme: { primary: '#10B981', secondary: 'white' } },
          error: { iconTheme: { primary: '#EF4444', secondary: 'white' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/login/doctor" element={<PublicRoute><DoctorLogin /></PublicRoute>} />
        <Route path="/login/admin" element={<PublicRoute><AdminLogin /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        
        {/* Main App Block */}
        <Route path="/" element={<RoleRoute><AppLayout /></RoleRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="goals" element={<Goals />} />
          <Route path="insights" element={<Insights />} />
          <Route path="coach" element={<AICoach />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="social" element={<Social />} />
          <Route path="profile" element={<Profile />} />
          <Route path="medical" element={<MedicalRecord />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="settings" element={<Settings />} />
          <Route path="portal/patient" element={<PatientPortal />} />
          <Route path="portal/doctor" element={<DoctorPortal />} />
          <Route path="portal/admin" element={<AdminPortal />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
