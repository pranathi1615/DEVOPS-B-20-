import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Eye, EyeOff, Lock, Mail, ShieldAlert, CheckCircle2 } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both your institutional email and password.');
      return;
    }

    setLoading(true);
    try {
      const userData = await login(email, password);
      // Redirect based on role
      switch (userData.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'coordinator':
          navigate('/coordinator/dashboard');
          break;
        case 'invigilator':
          navigate('/invigilator/dashboard');
          break;
        case 'student':
        default:
          navigate('/student/dashboard');
          break;
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helper for evaluator convenience
  const fillCredentials = (role) => {
    switch (role) {
      case 'admin':
        setEmail('admin@examportal.edu');
        setPassword('Admin@123');
        break;
      case 'coordinator':
        setEmail('coordinator@examportal.edu');
        setPassword('Coord@123');
        break;
      case 'invigilator':
        setEmail('invigilator@examportal.edu');
        setPassword('Invig@123');
        break;
      case 'student':
        setEmail('student@examportal.edu');
        setPassword('Student@123');
        break;
      default:
        break;
    }
    setError('');
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSuccess(true);
    setTimeout(() => {
      setShowForgotModal(false);
      setForgotSuccess(false);
      setForgotEmail('');
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 mb-3">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Examination Portal
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Online Invigilation & Real-Time Session Monitoring System
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-100">
          {/* Quick Role Fill Pills */}
          <div className="mb-6 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Select Demo Credentials:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillCredentials('admin')}
                className="py-1.5 px-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium text-left flex items-center justify-between transition-colors"
              >
                <span>Admin</span>
                <span className="text-[10px] text-blue-600 font-bold">Fill</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('coordinator')}
                className="py-1.5 px-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium text-left flex items-center justify-between transition-colors"
              >
                <span>Coordinator</span>
                <span className="text-[10px] text-blue-600 font-bold">Fill</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('invigilator')}
                className="py-1.5 px-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium text-left flex items-center justify-between transition-colors"
              >
                <span>Invigilator</span>
                <span className="text-[10px] text-blue-600 font-bold">Fill</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('student')}
                className="py-1.5 px-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium text-left flex items-center justify-between transition-colors"
              >
                <span>Student</span>
                <span className="text-[10px] text-blue-600 font-bold">Fill</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Institutional Email Address
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. candidate@examportal.edu"
                  required
                  className="block w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your security password"
                  required
                  className="block w-full pl-9 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 mr-2"
                />
                Remember institutional session
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Authenticating Candidate...' : 'Sign In to Proctor Portal'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Online Examination Invigilation & Proctoring Suite • Secure Session Verifier
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-800">Password Reset Request</h3>
            <p className="text-xs text-slate-500 mt-1">
              Enter your registered academic email address to receive password recovery instructions.
            </p>

            {forgotSuccess ? (
              <div className="my-4 p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span>Reset link dispatched to institutional inbox!</span>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="mt-4 space-y-3">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="institutional@examportal.edu"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
