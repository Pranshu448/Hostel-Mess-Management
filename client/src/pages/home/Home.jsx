import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="hero-container">
      <div style={{ zIndex: 1, position: 'relative' }}>
        <h1 className="hero-title">ExperienceHMMS</h1>
        <p className="hero-subtitle">
          Secure, modern, and efficient hostel management system designed exclusively for the NITJ campus community.
        </p>
        <div className="hero-actions" style={{ justifyContent: 'center' }}>
          <Link to="/login" className="btn-large btn-primary">
            Sign In
          </Link>
          <Link to="/signup" className="btn-large btn-outline">
            Create Account
          </Link>
        </div>
      </div>

      {/* Decorative background blur elements */}
      <div style={{
        position: 'absolute', top: '20%', left: '15%', width: '300px', height: '300px',
        background: 'rgba(79, 70, 229, 0.4)', filter: 'blur(100px)', borderRadius: '50%', zIndex: 0
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '20%', width: '400px', height: '400px',
        background: 'rgba(168, 85, 247, 0.3)', filter: 'blur(120px)', borderRadius: '50%', zIndex: 0
      }} />
    </div>
  );
}

export default Home;
