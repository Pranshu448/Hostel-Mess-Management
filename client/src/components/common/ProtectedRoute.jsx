import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function ProtectedRoute({ children }) {
  const { user, loading, token } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  if (!token || !user) {
    // Redirect to login if there is no token or user (failed verification)
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
