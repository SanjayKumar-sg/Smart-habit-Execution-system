import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useStore } from '../store/useStore';

export default function AppLayout() {
  const sidebarOpen = useStore(s => s.sidebarOpen);
  return (
    <div className="app-layout">
      <Sidebar />
      <div className={`main-content ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
        <Header />
        <div className="page-container">
          <Outlet />
        </div>
        <div className="spacer" />
      </div>
    </div>
  );
}
