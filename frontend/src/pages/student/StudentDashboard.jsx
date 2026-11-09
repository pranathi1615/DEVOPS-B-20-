import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import {
  BookOpen,
  CheckCircle,
  Clock,
  Calendar,
  Award,
  AlertTriangle,
  PlayCircle,
  HelpCircle,
  UserCheck,
  ShieldCheck
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/stats/overview');
        if (res.data.success) {
          setDashboardData(res.data);
        }
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const assignedExams = dashboardData?.assignedExams || [];
  const completedSessions = dashboardData?.completedSessions || [];
  const attendance = dashboardData?.attendance || [];
  const stats = dashboardData?.stats || {};

  const upcomingExams = assignedExams.filter(e => e.status === 'scheduled');
  const ongoingExams = assignedExams.filter(e => e.status === 'ongoing');

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-blue-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-blue-300 font-semibold">
            Institutional Candidate Portal
          </span>
          <h1 className="text-2xl font-bold mt-1">Welcome back, {user?.name}!</h1>
          <p className="text-xs text-slate-300 mt-1">
            Student ID: <span className="font-mono text-blue-300">{user?.studentId || 'N/A'}</span> • Department: {user?.department}
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Institutional Proctoring Cleared</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Assigned Papers"
          value={stats.assignedCount || assignedExams.length}
          icon={BookOpen}
          color="blue"
          subtitle="Total semester curriculum"
        />
        <StatCard
          title="Upcoming Papers"
          value={stats.upcomingCount || upcomingExams.length}
          icon={Clock}
          color="amber"
          subtitle="Scheduled testing slots"
        />
        <StatCard
          title="Completed Exams"
          value={stats.completedCount || completedSessions.length}
          icon={CheckCircle}
          color="green"
          subtitle="Successfully evaluated"
        />
      </div>

      {/* Active & Ongoing Papers (Actionable) */}
      {ongoingExams.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center space-x-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h3 className="font-bold text-sm text-blue-900">
              Active Examination Currently In Progress!
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ongoingExams.map((exam) => (
              <div key={exam._id} className="bg-white p-4 rounded-xl border border-blue-200/80 shadow-xs flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-800">{exam.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{exam.description}</p>
                  <div className="mt-3 text-xs text-slate-600 flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>{exam.duration} Minutes</span>
                    </span>
                    <span>•</span>
                    <span>{exam.questions?.length || 0} Questions</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-600 font-semibold">Testing Window Open</span>
                  <Link
                    to={`/student/exam/${exam._id}`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Start / Resume Exam</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming & Completed Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Examinations */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Upcoming Scheduled Papers</h3>
          <div className="space-y-3">
            {upcomingExams.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No upcoming examinations pending.</p>
            ) : (
              upcomingExams.map((exam) => (
                <div key={exam._id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-xs text-slate-800 line-clamp-1">{exam.title}</h4>
                    <div className="mt-1 text-[11px] text-slate-500 flex items-center space-x-2">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{new Date(exam.examDate).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{exam.startTime} - {exam.endTime} ({exam.duration}m)</span>
                    </div>
                  </div>
                  <Badge variant="primary" size="sm">Scheduled</Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Completed Examination History */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Completed Examination History</h3>
          <div className="space-y-3">
            {completedSessions.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No examination submissions on file yet.</p>
            ) : (
              completedSessions.map((sess) => (
                <div key={sess._id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-xs text-slate-800 line-clamp-1">{sess.examId?.title || 'Exam'}</h4>
                    <span className="text-[10px] text-slate-400">
                      Submitted: {sess.submittedAt ? new Date(sess.submittedAt).toLocaleString() : 'Done'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-xs text-blue-600 block">
                      {sess.score || 0} / {sess.examId?.totalMarks || 0} Marks
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Completed</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
