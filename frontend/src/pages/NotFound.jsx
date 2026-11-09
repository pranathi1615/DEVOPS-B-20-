import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
        <GraduationCap className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-800">404</h1>
      <h2 className="text-base font-bold text-slate-700 mt-2">Examination Route Not Found</h2>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">
        The requested proctoring module, report, or candidate session URL does not exist or has been archived.
      </p>
      <Link
        to="/login"
        className="mt-5 inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Login / Home</span>
      </Link>
    </div>
  );
};

export default NotFound;
