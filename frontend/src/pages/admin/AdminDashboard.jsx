import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import {
  Users,
  GraduationCap,
  BookOpen,
  PlayCircle,
  ShieldAlert,
  CheckCircle,
  Video,
  Clock,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/stats/overview');
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Error fetching admin dashboard stats:', err);
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

  const stats = data?.stats || {};
  const recentIncidents = data?.recentIncidents || [];
  const recentActivities = data?.recentActivities || [];
  const upcomingExams = data?.upcomingExams || [];

  // Attendance Chart Data
  const attendanceChartData = [
    { name: 'Present', value: stats.attendanceMap?.present || 0, color: '#10B981' },
    { name: 'Absent', value: stats.attendanceMap?.absent || 0, color: '#F43F5E' },
    { name: 'Late', value: stats.attendanceMap?.late || 0, color: '#F59E0B' }
  ];

  // Examination Status Distribution
  const examActivityData = [
    { name: 'Scheduled', count: (stats.totalExams || 0) - (stats.activeExams || 0) - (stats.completedExams || 0) },
    { name: 'Ongoing', count: stats.activeExams || 0 },
    { name: 'Completed', count: stats.completedExams || 0 }
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-blue-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-blue-300 font-semibold">
            Central Administrative Overview
          </span>
          <h1 className="text-2xl font-bold mt-1">System Command & Invigilation Center</h1>
          <p className="text-xs text-slate-300 mt-1">
            Real-time examination telemetry, candidate verifications, and compliance logs across all departments.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/invigilator/live"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-colors"
          >
            <Video className="w-4 h-4" />
            <span>Open Live Invigilation</span>
          </Link>
          <Link
            to="/reports/exam-summary"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs transition-colors"
          >
            <span>View Reports</span>
          </Link>
        </div>
      </div>

      {/* 8 System Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers || 0}
          icon={Users}
          color="blue"
          subtitle={`${stats.totalCoordinators || 0} Coordinators`}
        />
        <StatCard
          title="Total Students"
          value={stats.totalStudents || 0}
          icon={GraduationCap}
          color="indigo"
          subtitle="Enrolled candidates"
        />
        <StatCard
          title="Total Invigilators"
          value={stats.totalInvigilators || 0}
          icon={UserCheck}
          color="purple"
          subtitle="Assigned faculty"
        />
        <StatCard
          title="Total Examinations"
          value={stats.totalExams || 0}
          icon={BookOpen}
          color="navy"
          subtitle="Curriculum papers"
        />
        <StatCard
          title="Active Examinations"
          value={stats.activeExams || 0}
          icon={PlayCircle}
          color="green"
          subtitle="Currently running"
        />
        <StatCard
          title="Ongoing Sessions"
          value={stats.ongoingSessions || 0}
          icon={Video}
          color="blue"
          subtitle="Candidates testing"
        />
        <StatCard
          title="Total Incidents"
          value={stats.totalIncidents || 0}
          icon={ShieldAlert}
          color="red"
          subtitle="Observations logged"
        />
        <StatCard
          title="Completed Exams"
          value={stats.completedExams || 0}
          icon={CheckCircle}
          color="amber"
          subtitle="Successfully finalized"
        />
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Examination Lifecycle Distribution */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Examination Activity Distribution</h3>
              <p className="text-xs text-slate-400">Scheduled vs Ongoing vs Completed exam counts</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
              Live State
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={examActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#2563EB" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Candidate Attendance Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-slate-800">Candidate Attendance Overview</h3>
            <p className="text-xs text-slate-400">Present, Absent & Late verification ratios</p>
          </div>
          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {attendanceChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Incidents, Upcoming Exams, Activity Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Incidents */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Recent Security Incidents</h3>
              <p className="text-xs text-slate-400">Proctoring observations logged</p>
            </div>
            <Link to="/incidents" className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentIncidents.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No recent incidents recorded.</p>
            ) : (
              recentIncidents.map((inc) => (
                <div key={inc._id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-slate-800">
                        {inc.studentId?.name || 'Candidate'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {inc.studentId?.studentId || inc.incidentId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-1">{inc.description}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(inc.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <Badge
                    variant={inc.severity === 'high' ? 'danger' : inc.severity === 'medium' ? 'warning' : 'primary'}
                    size="sm"
                  >
                    {inc.severity}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Examinations */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Upcoming Examinations</h3>
              <p className="text-xs text-slate-400">Scheduled session calendar</p>
            </div>
            <Link to="/coordinator/scheduling" className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center">
              <span>Schedule</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingExams.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No upcoming examinations scheduled.</p>
            ) : (
              upcomingExams.map((exam) => (
                <div key={exam._id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-800 line-clamp-1">{exam.title}</h4>
                    <Badge variant={exam.status === 'ongoing' ? 'success' : 'primary'} size="sm">
                      {exam.status}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center text-[11px] text-slate-500 space-x-3">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{exam.startTime} - {exam.endTime}</span>
                    </span>
                    <span>•</span>
                    <span>{new Date(exam.examDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Audit Logs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">System Activity Logs</h3>
              <p className="text-xs text-slate-400">Security & audit trails</p>
            </div>
            <Link to="/admin/audit-logs" className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center">
              <span>Audit Log</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          <div className="space-y-2.5">
            {recentActivities.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No audit logs recorded.</p>
            ) : (
              recentActivities.map((log) => (
                <div key={log._id} className="text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-semibold text-slate-700 font-mono text-[11px]">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5">{log.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
