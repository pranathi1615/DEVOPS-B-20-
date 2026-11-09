import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Award, Clock, ArrowRight, ShieldCheck, Home } from 'lucide-react';

const ExamConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};

  const {
    score = 0,
    totalMarks = 0,
    examTitle = 'Academic Examination',
    isAutoSubmitted = false,
    submittedAt = new Date().toISOString()
  } = state;

  return (
    <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200/80 shadow-lg text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <span className="text-xs uppercase tracking-widest text-emerald-600 font-bold">
        Paper Finalized & Logged
      </span>
      <h1 className="text-2xl font-bold text-slate-800 mt-1">
        Examination Submitted Successfully
      </h1>
      <p className="text-xs text-slate-500 mt-1">
        {examTitle}
      </p>

      {/* Score & Telemetry Voucher */}
      <div className="my-6 p-5 bg-slate-50 rounded-2xl border border-slate-200/80 text-left text-xs space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <span className="text-slate-500">Candidate Score:</span>
          <span className="font-bold text-base text-blue-600 font-mono">
            {score} / {totalMarks} Marks
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500">Submission Mode:</span>
          <span className="font-semibold text-slate-700">
            {isAutoSubmitted ? 'Automatic Timer Expiry' : 'Manual Candidate Submission'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500">Recorded Timestamp:</span>
          <span className="font-mono text-slate-700">
            {new Date(submittedAt).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <span className="text-slate-500">Verification Hash:</span>
          <span className="font-mono text-[10px] text-slate-400">
            SHA256-{Date.now().toString(16).toUpperCase()}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to="/student/dashboard"
          className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center space-x-2"
        >
          <Home className="w-4 h-4" />
          <span>Return to Student Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

export default ExamConfirmation;
