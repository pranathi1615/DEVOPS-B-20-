import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import {
  Video,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Wifi,
  WifiOff,
  Eye,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Camera
} from 'lucide-react';

const LiveInvigilation = () => {
  const { socket, joinExamRoom } = useSocket();

  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Selected student modal
  const [selectedSession, setSelectedSession] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Manual incident report modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [incidentForm, setIncidentForm] = useState({
    studentId: '',
    studentName: '',
    incidentType: 'suspicious_activity',
    severity: 'medium',
    description: ''
  });

  // Fetch active exams
  const fetchActiveExams = async () => {
    try {
      const res = await api.get('/exams');
      if (res.data.success) {
        setExams(res.data.exams);
        if (res.data.exams.length > 0 && !selectedExamId) {
          // Select ongoing or first exam by default
          const ongoing = res.data.exams.find(e => e.status === 'ongoing') || res.data.exams[0];
          setSelectedExamId(ongoing._id);
        }
      }
    } catch (err) {
      console.error('Error fetching exams:', err);
    }
  };

  // Fetch sessions for selected exam
  const fetchSessions = async (examId) => {
    if (!examId) return;
    setLoading(true);
    try {
      const [sessRes, incRes] = await Promise.all([
        api.get('/sessions', { params: { examId } }),
        api.get('/incidents', { params: { examId } })
      ]);

      if (sessRes.data.success) {
        setSessions(sessRes.data.sessions);
      }
      if (incRes.data.success) {
        setIncidents(incRes.data.incidents);
      }
    } catch (err) {
      console.error('Error fetching live sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveExams();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      fetchSessions(selectedExamId);
      joinExamRoom(selectedExamId);
    }
  }, [selectedExamId]);

  // Real-time Socket.IO Listeners
  useEffect(() => {
    if (!socket) return;

    // 1. New student joins session
    socket.on('session_started', (newSession) => {
      setSessions((prev) => {
        const exists = prev.find((s) => s._id === newSession._id);
        if (exists) {
          return prev.map((s) => (s._id === newSession._id ? newSession : s));
        }
        return [newSession, ...prev];
      });
    });

    // 2. Realtime activity heartbeat / tab switch / fullscreen exit
    socket.on('session_activity_update', (data) => {
      setSessions((prev) =>
        prev.map((s) => {
          if (s._id === data.sessionId || s.studentId?._id === data.studentId) {
            return {
              ...s,
              lastActivity: data.lastActivity,
              tabSwitchCount: data.tabSwitchCount,
              fullscreenExitCount: data.fullscreenExitCount,
              networkStatus: data.networkStatus,
              webcamPermissionStatus: data.webcamPermissionStatus || s.webcamPermissionStatus
            };
          }
          return s;
        })
      );

      // If an incident was logged, update incidents list
      if (data.incident) {
        setIncidents((prev) => [data.incident, ...prev]);
      }
    });

    // 3. Candidate submitted paper
    socket.on('student_submitted', (data) => {
      setSessions((prev) =>
        prev.map((s) => {
          if (s._id === data.sessionId || s.studentId?._id === data.studentId) {
            return {
              ...s,
              status: 'completed',
              submittedAt: data.submittedAt,
              isAutoSubmitted: data.isAutoSubmitted,
              score: data.score
            };
          }
          return s;
        })
      );
    });

    // 4. Invigilator recorded incident
    socket.on('incident_recorded', (incident) => {
      setIncidents((prev) => [incident, ...prev]);
    });

    return () => {
      socket.off('session_started');
      socket.off('session_activity_update');
      socket.off('student_submitted');
      socket.off('incident_recorded');
    };
  }, [socket]);

  const currentExam = exams.find((e) => e._id === selectedExamId);

  // Compute live statistics
  const enrolledCount = currentExam?.assignedStudents?.length || sessions.length;
  const takingExamCount = sessions.filter((s) => s.status === 'in_progress').length;
  const submittedCount = sessions.filter((s) => s.status === 'completed').length;
  const disconnectedCount = sessions.filter(
    (s) => s.status === 'in_progress' && s.networkStatus === 'offline'
  ).length;
  const presentCount = sessions.length;
  const absentCount = Math.max(0, enrolledCount - presentCount);

  // Incident count map per student
  const studentIncidentMap = {};
  incidents.forEach((inc) => {
    const sId = inc.studentId?._id || inc.studentId;
    studentIncidentMap[sId] = (studentIncidentMap[sId] || 0) + 1;
  });

  const openStudentDetail = (session) => {
    setSelectedSession(session);
    setIsDetailModalOpen(true);
  };

  const openReportModal = (session) => {
    setIncidentForm({
      studentId: session.studentId?._id,
      studentName: session.studentId?.name || 'Candidate',
      incidentType: 'suspicious_activity',
      severity: 'medium',
      description: ''
    });
    setIsReportModalOpen(true);
  };

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/incidents', {
        examId: selectedExamId,
        studentId: incidentForm.studentId,
        incidentType: incidentForm.incidentType,
        severity: incidentForm.severity,
        description: incidentForm.description
      });

      if (res.data.success) {
        setIsReportModalOpen(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record incident');
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const name = s.studentId?.name?.toLowerCase() || '';
    const code = s.studentId?.studentId?.toLowerCase() || '';
    return name.includes(search.toLowerCase()) || code.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-800">Live Examination Invigilation Center</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700 animate-pulse">
              ● Live Stream
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time candidate monitoring, browser telemetry, and observation auditing via Socket.IO
          </p>
        </div>

        {/* Exam Switcher */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500">Active Paper:</span>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-800 outline-none focus:border-blue-500 shadow-xs"
          >
            {exams.map((ex) => (
              <option key={ex._id} value={ex._id}>
                {ex.title} ({ex.status})
              </option>
            ))}
          </select>
          <button
            onClick={() => fetchSessions(selectedExamId)}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh State"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 7 Telemetry Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Enrolled</span>
          <span className="text-xl font-bold text-slate-800 mt-0.5 block">{enrolledCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Present</span>
          <span className="text-xl font-bold text-emerald-600 mt-0.5 block">{presentCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Absent</span>
          <span className="text-xl font-bold text-slate-400 mt-0.5 block">{absentCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Taking Exam</span>
          <span className="text-xl font-bold text-blue-600 mt-0.5 block">{takingExamCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Submitted</span>
          <span className="text-xl font-bold text-purple-600 mt-0.5 block">{submittedCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Disconnected</span>
          <span className="text-xl font-bold text-amber-600 mt-0.5 block">{disconnectedCount}</span>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Incidents</span>
          <span className="text-xl font-bold text-rose-600 mt-0.5 block">{incidents.length}</span>
        </div>
      </div>

      {/* Realtime Candidate Monitoring Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate by name or ID..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
            />
          </div>
          <span className="text-xs text-slate-400">
            {filteredSessions.length} Active Sessions Tracked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Student Name & ID</th>
                <th className="py-3 px-4">Login Time</th>
                <th className="py-3 px-4">Session Status</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4">Webcam / Fullscreen</th>
                <th className="py-3 px-4">Incidents</th>
                <th className="py-3 px-4">Submission Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </td>
                </tr>
              ) : filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No active student sessions logged yet for this paper.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((sess) => {
                  const sId = sess.studentId?._id;
                  const incidentCount = studentIncidentMap[sId] || (sess.tabSwitchCount || 0) + (sess.fullscreenExitCount || 0);

                  return (
                    <tr key={sess._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-semibold text-slate-800">{sess.studentId?.name || 'Candidate'}</p>
                          <span className="font-mono text-blue-600 text-[11px]">
                            {sess.studentId?.studentId || 'ID-PENDING'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {sess.loginTime ? new Date(sess.loginTime).toLocaleTimeString() : '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            sess.status === 'in_progress'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : sess.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              sess.status === 'in_progress' ? 'bg-blue-600 animate-pulse' : 'bg-emerald-600'
                            }`}
                          />
                          {sess.status === 'in_progress' ? 'Testing' : sess.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {sess.lastActivity ? new Date(sess.lastActivity).toLocaleTimeString() : '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                              sess.webcamPermissionStatus === 'granted'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            <Camera className="w-3 h-3 mr-1" />
                            {sess.webcamPermissionStatus || 'prompt'}
                          </span>
                          {sess.tabSwitchCount > 0 && (
                            <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                              {sess.tabSwitchCount} Tab Sw.
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded-full text-xs font-mono ${
                            incidentCount > 0
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {incidentCount}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {sess.status === 'completed' ? (
                          <span className="text-emerald-600 font-semibold text-xs">
                            Submitted {sess.isAutoSubmitted ? '(Auto)' : '(Manual)'}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">In Progress</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            onClick={() => openStudentDetail(sess)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Session Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openReportModal(sess)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Log Observation / Incident"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Session Details Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Candidate Telemetry: ${selectedSession?.studentId?.name || 'Session'}`}
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
            <div>
              <span className="text-slate-400">Institutional ID:</span>
              <p className="font-semibold text-slate-800">{selectedSession?.studentId?.studentId || 'N/A'}</p>
            </div>
            <div>
              <span className="text-slate-400">Department:</span>
              <p className="font-semibold text-slate-800">{selectedSession?.studentId?.department || 'N/A'}</p>
            </div>
            <div>
              <span className="text-slate-400">Session Started:</span>
              <p className="font-semibold text-slate-800">
                {selectedSession?.sessionStart ? new Date(selectedSession.sessionStart).toLocaleTimeString() : '-'}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Last Telemetry Ping:</span>
              <p className="font-semibold text-slate-800">
                {selectedSession?.lastActivity ? new Date(selectedSession.lastActivity).toLocaleTimeString() : '-'}
              </p>
            </div>
          </div>

          <h4 className="font-bold text-slate-700">Integrity & Environment Verification</h4>
          <div className="space-y-2 border border-slate-200 rounded-xl p-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Webcam Permission Status:</span>
              <Badge variant={selectedSession?.webcamPermissionStatus === 'granted' ? 'success' : 'warning'} size="sm">
                {selectedSession?.webcamPermissionStatus || 'prompt'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Tab Switch Occurrences:</span>
              <span className="font-bold font-mono text-slate-800">
                {selectedSession?.tabSwitchCount || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Fullscreen Exit Occurrences:</span>
              <span className="font-bold font-mono text-slate-800">
                {selectedSession?.fullscreenExitCount || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Disconnection Occurrences:</span>
              <span className="font-bold font-mono text-slate-800">
                {selectedSession?.disconnectionCount || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Network Telemetry:</span>
              <Badge variant={selectedSession?.networkStatus === 'online' ? 'success' : 'danger'} size="sm">
                {selectedSession?.networkStatus || 'online'}
              </Badge>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-semibold"
            >
              Close Telemetry View
            </button>
          </div>
        </div>
      </Modal>

      {/* Manual Incident Report Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title={`Record Proctoring Incident: ${incidentForm.studentName}`}
      >
        <form onSubmit={handleCreateIncident} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Incident Category</label>
            <select
              value={incidentForm.incidentType}
              onChange={(e) => setIncidentForm({ ...incidentForm, incidentType: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
            >
              <option value="tab_switch">Tab Switching</option>
              <option value="fullscreen_exit">Fullscreen Exit</option>
              <option value="multiple_disconnections">Multiple Disconnections</option>
              <option value="suspicious_activity">Suspicious Session Activity</option>
              <option value="late_login">Late Login</option>
              <option value="unauthorized_device">Unauthorized Device</option>
              <option value="other">Other Invigilator Observation</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Severity Level</label>
            <select
              value={incidentForm.severity}
              onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
            >
              <option value="low">Low (Noticeable variation)</option>
              <option value="medium">Medium (Repeated warning)</option>
              <option value="high">High (Suspected misconduct)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Observation Description</label>
            <textarea
              required
              rows="3"
              value={incidentForm.description}
              onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
              placeholder="Provide objective observational notes..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 shadow-xs"
            >
              Log Incident Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LiveInvigilation;
