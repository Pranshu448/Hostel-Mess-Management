import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-4 text-center">
        <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Mess Management System</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          QR attendance, weekly menu, food preferences, payments, feedback, and admin control in one clean dashboard.
        </p>
        <div className="mt-8 flex gap-4">
          <Link to="/auth" className="rounded-md bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700">
            Login / Register
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;
