import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import {
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  CheckCircle,
  Users,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2
} from 'lucide-react';

const ExamScheduling = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [conflicts, setConflicts] = useState([]);

  // Reschedule modal
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [examToReschedule, setExamToReschedule] = useState(null);
  const [scheduleData, setScheduleData] = useState({
    examDate: '',
    startTime: '',
    endTime: '',
    duration: 60
  });

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await api.get('/exams');
      if (res.data.success) {
        setExams(res.data.exams);
        detectConflicts(res.data.exams);
      }
    } catch (err) {
      console.error('Failed to load exam schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  // Detect time overlap conflicts among exams on the same day
  const detectConflicts = (examList) => {
    const conflictList = [];
    for (let i = 0; i < examList.length; i++) {
      for (let j = i + 1; j < examList.length; j++) {
        const e1 = examList[i];
        const e2 = examList[j];

        const d1 = new Date(e1.examDate).toISOString().split('T')[0];
        const d2 = new Date(e2.examDate).toISOString().split('T')[0];

        if (d1 === d2) {
          // Check overlap in hours/minutes e.g. "09:00" - "11:00"
          const toMins = (t) => {
            const [h, m] = (t || '00:00').split(':').map(Number);
            return h * 60 + m;
          };

          const s1 = toMins(e1.startTime);
          const end1 = toMins(e1.endTime);
          const s2 = toMins(e2.startTime);
          const end2 = toMins(e2.endTime);

          if (s1 < end2 && s2 < end1) {
            conflictList.push({
              date: d1,
              exam1: e1.title,
              exam2: e2.title,
              time1: `${e1.startTime} - ${e1.endTime}`,
              time2: `${e2.startTime} - ${e2.endTime}`
            });
          }
        }
      }
    }
    setConflicts(conflictList);
  };

  const openRescheduleModal = (exam) => {
    setExamToReschedule(exam);
    setScheduleData({
      examDate: exam.examDate ? new Date(exam.examDate).toISOString().split('T')[0] : '',
      startTime: exam.startTime,
      endTime: exam.endTime,
      duration: exam.duration
    });
    setRescheduleModalOpen(true);
  };

  const handleSaveReschedule = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/exams/${examToReschedule._id}`, scheduleData);
      setRescheduleModalOpen(false);
      fetchExams();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update schedule');
    }
  };

  // Filter exams for selected day
  const examsOnSelectedDate = exams.filter(e => {
    const examD = new Date(e.examDate).toISOString().split('T')[0];
    return examD === selectedDate;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Examination Master Schedule & Timetable</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Coordinate exam timeslots, detect overlapping schedules, and verify candidate allocations
          </p>
        </div>
      </div>

      {/* Conflict Alert Banner if any */}
      {conflicts.length > 0 ? (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold">Schedule Overlap Alert Detected ({conflicts.length})</h4>
            <p className="mt-0.5 text-amber-700">
              The following examinations share conflicting time windows on the same calendar day:
            </p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              {conflicts.map((c, idx) => (
                <li key={idx}>
                  <strong>{c.date}:</strong> "{c.exam1}" ({c.time1}) overlaps with "{c.exam2}" ({c.time2})
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>No scheduling conflicts detected across current exam timetables. All windows are isolated.</span>
        </div>
      )}

      {/* Calendar Controls and Day View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Date Selector & Quick Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Select Timetable Date</h3>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 mb-4"
          />

          <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
            Scheduled on {selectedDate}:
          </h4>
          <div className="space-y-2.5">
            {examsOnSelectedDate.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No exams scheduled for this date.</p>
            ) : (
              examsOnSelectedDate.map(e => (
                <div key={e._id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800 line-clamp-1">{e.title}</span>
                    <Badge variant={e.status === 'ongoing' ? 'success' : 'primary'} size="sm">
                      {e.status}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{e.startTime} - {e.endTime} ({e.duration} mins)</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Full Upcoming Master Schedule Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Upcoming Examination Timetable</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Examination</th>
                  <th className="py-2.5 px-3">Time Window</th>
                  <th className="py-2.5 px-3">Candidates</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Modify</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exams.map((exam) => (
                  <tr key={exam._id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-medium text-slate-700 whitespace-nowrap">
                      {new Date(exam.examDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {exam.title}
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {exam.startTime} - {exam.endTime} ({exam.duration}m)
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {exam.assignedStudents?.length || 0}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={exam.status === 'ongoing' ? 'success' : exam.status === 'completed' ? 'default' : 'primary'} size="sm">
                        {exam.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => openRescheduleModal(exam)}
                        className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                        title="Reschedule Exam"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      <Modal
        isOpen={rescheduleModalOpen}
        onClose={() => setRescheduleModalOpen(false)}
        title={`Reschedule "${examToReschedule?.title || 'Exam'}"`}
      >
        <form onSubmit={handleSaveReschedule} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Examination Date</label>
            <input
              type="date"
              required
              value={scheduleData.examDate}
              onChange={(e) => setScheduleData({ ...scheduleData, examDate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Time</label>
              <input
                type="time"
                required
                value={scheduleData.startTime}
                onChange={(e) => setScheduleData({ ...scheduleData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Time</label>
              <input
                type="time"
                required
                value={scheduleData.endTime}
                onChange={(e) => setScheduleData({ ...scheduleData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Duration (Minutes)</label>
            <input
              type="number"
              required
              min="5"
              value={scheduleData.duration}
              onChange={(e) => setScheduleData({ ...scheduleData, duration: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
            />
          </div>
          <div className="pt-3 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setRescheduleModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
            >
              Confirm Reschedule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ExamScheduling;
