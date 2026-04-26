import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // Import user and logout from Context
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Dashboard Placeholder</h1>
      <p>Welcome, {user?.username || 'Student'}!</p>
      <p>This page is intentionally kept blank as requested.</p>
      <button 
        onClick={handleLogout}
        style={{
          marginTop: '2rem',
          padding: '0.5rem 1rem',
          background: 'transparent',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default Dashboard;