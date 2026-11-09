import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import {
  Video,
  Users,
  ShieldAlert,
  Clock,
  BookOpen,
  ArrowRight,
  Calendar,
  CheckCircle2
} from 'lucide-react';

const InvigilatorDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/stats/overview');
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Error fetching invigilator dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const assignedExams = data?.assignedExams || [];
  const recentIncidents = data?.recentIncidents || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-indigo-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-indigo-300 font-semibold">
            Proctoring & Invigilation Desk
          </span>
          <h1 className="text-2xl font-bold mt-1">Invigilator Command Terminal</h1>
          <p className="text-xs text-slate-300 mt-1">
            Supervise scheduled sessions, monitor candidate compliance telemetry, and log behavioral observations.
          </p>
        </div>
        <Link
          to="/invigilator/live"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-colors"
        >
          <Video className="w-4 h-4" />
          <span>Launch Live Proctoring Console</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Assigned Examinations"
          value={stats.assignedExamsCount || assignedExams.length}
          icon={BookOpen}
          color="indigo"
          subtitle="Assigned for supervision"
        />
        <StatCard
          title="Active Testing Sessions"
          value={stats.ongoingSessions || 0}
          icon={Video}
          color="blue"
          subtitle="Candidates currently writing"
        />
        <StatCard
          title="Reported Incidents"
          value={stats.totalIncidents || 0}
          icon={ShieldAlert}
          color="red"
          subtitle="Exceptions logged"
        />
      </div>

      {/* Assigned Examinations List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Your Assigned Examinations</h3>
            <Link to="/invigilator/live" className="text-xs text-blue-600 font-semibold flex items-center">
              <span>Go to Live Stream</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="space-y-3">
            {assignedExams.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No assigned examination sessions on record.</p>
            ) : (
              assignedExams.map((exam) => (
                <div key={exam._id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-xs text-slate-800">{exam.title}</h4>
                    <div className="mt-1 text-[11px] text-slate-500 flex items-center space-x-2">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{exam.startTime} - {exam.endTime} ({exam.duration}m)</span>
                      <span>•</span>
                      <span>{exam.assignedStudents?.length || 0} Candidates</span>
                    </div>
                  </div>
                  <Badge variant={exam.status === 'ongoing' ? 'success' : 'primary'} size="sm">
                    {exam.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Observation Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Recent Observation Log</h3>
            <Link to="/incidents" className="text-xs text-blue-600 font-semibold flex items-center">
              <span>View All Incidents</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentIncidents.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No recent incident alerts logged.</p>
            ) : (
              recentIncidents.map((inc) => (
                <div key={inc._id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-800">
                      {inc.studentId?.name || 'Candidate'} ({inc.incidentId})
                    </span>
                    <Badge variant={inc.severity === 'high' ? 'danger' : 'warning'} size="sm">
                      {inc.severity}
                    </Badge>
                  </div>
                  <p className="text-slate-600 text-[11px] line-clamp-1">{inc.description}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(inc.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvigilatorDashboard;
