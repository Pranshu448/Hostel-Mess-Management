import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function AuthPage() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'student',
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
        await signup(formData.username, formData.email, formData.password, formData.role);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{isLogin ? 'Welcome back' : 'Create account'}</h1>
          <p className="text-sm text-slate-500">Use your credentials to access the Mess Management System.</p>
        </div>
        {error && <div className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="username">Username</label>
              <input
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
          )}

          {!isLogin && (
            <div className="mb-3">
              <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">Email</label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password">Password</label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
            />
          </div>

          <button type="submit" className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-4 text-sm text-slate-600">
          <button className="font-medium text-blue-600" onClick={() => setIsLogin((prev) => !prev)}>
            {isLogin ? 'Need an account? Register' : 'Already registered? Login'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;