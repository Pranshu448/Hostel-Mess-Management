import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function AuthPage({ type }) {
  const isLogin = type === 'login';
  const navigate = useNavigate();
  const { login, signup } = useAuth(); // Import from context instead of raw axios

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await signup(formData.username, formData.email, formData.password);
      }
      // Context sets token automatically and persists to localStorage via hmms_token
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Decorative background blur elements */}
      <div style={{
        position: 'fixed', top: '10%', left: '10%', width: '300px', height: '300px',
        background: 'rgba(79, 70, 229, 0.4)', filter: 'blur(100px)', borderRadius: '50%', zIndex: 0
      }} />
      <div style={{
        position: 'fixed', bottom: '10%', right: '10%', width: '400px', height: '400px',
        background: 'rgba(168, 85, 247, 0.3)', filter: 'blur(120px)', borderRadius: '50%', zIndex: 0
      }} />

      <div className="auth-card glass-panel" style={{ zIndex: 1 }}>
        <div className="auth-header">
          <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p>{isLogin ? 'Sign in to access your dashboard' : 'Join HMMS to manage your hostel'}</p>
        </div>

        {error && <div className="error-text">{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input 
                type="text" 
                id="username" 
                name="username" 
                placeholder="johndoe" 
                value={formData.username}
                onChange={handleChange}
                required={!isLogin} 
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              placeholder="student@nitj.ac.in" 
              value={formData.email}
              onChange={handleChange}
              required 
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              placeholder="••••••••" 
              value={formData.password}
              onChange={handleChange}
              required 
              minLength={8}
            />
          </div>

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="auth-footer">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <Link to={isLogin ? '/signup' : '/login'}>
            {isLogin ? 'Sign Up' : 'Log In'}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;