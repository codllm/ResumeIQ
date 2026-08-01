import React, { useContext } from 'react';
import { useNavigate } from 'react-router';
import { AuthContext } from '../../context/user.context';

const Home = () => {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-100 p-8 space-y-6 text-center">
        
        {/* Success Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Welcome Home!
          </h1>
          <p className="text-sm text-slate-500">
            You are logged in and viewing a protected route.
          </p>
        </div>

        {/* User Card */}
        {user && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-left space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Account Details
            </p>
            {user.username && (
              <p className="text-sm font-medium text-slate-800">
                <span className="text-slate-500">Name:</span> {user.username}
              </p>
            )}
            <p className="text-sm font-medium text-slate-800">
              <span className="text-slate-500">Email:</span> {user.email}
            </p>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-medium py-2.5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-150 cursor-pointer"
        >
          Sign Out
        </button>

      </div>
    </div>
  );
};

export default Home;
