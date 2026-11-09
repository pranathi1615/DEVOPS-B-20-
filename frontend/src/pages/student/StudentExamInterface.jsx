import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import Modal from '../../components/common/Modal';
import {
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Video,
  Send,
  Save
} from 'lucide-react';

const StudentExamInterface = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, joinExamRoom, sendStudentHeartbeat } = useSocket();

  const [exam, setExam] = useState(null);
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: selectedIndex }
  const [reviews, setReviews] = useState({}); // { questionId: boolean }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Consent & Monitoring States
  const [consentGiven, setConsentGiven] = useState(false);
  const [webcamStatus, setWebcamStatus] = useState('prompt');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tabSwitchWarning, setTabSwitchWarning] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  // Timer state (seconds)
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Saved'); // 'Saving...', 'Saved'

  // Initialize Exam & Session
  useEffect(() => {
    const initExam = async () => {
      try {
        // Fetch exam
        const examRes = await api.get(`/exams/${examId}`);
        if (!examRes.data.success) throw new Error('Exam not found');
        const examData = examRes.data.exam;
        setExam(examData);
        setQuestions(examData.questions || []);

        // Start or resume session
        const sessionRes = await api.post('/sessions/start', {
          examId,
          webcamPermissionStatus: webcamStatus
        });

        if (sessionRes.data.success) {
          const sess = sessionRes.data.session;
          setSession(sess);

          // Calculate remaining time
          const durationMins = examData.duration || 60;
          const sessionStartTime = new Date(sess.sessionStart).getTime();
          const elapsedSecs = Math.floor((Date.now() - sessionStartTime) / 1000);
          const totalSecs = durationMins * 60;
          const remaining = Math.max(0, totalSecs - elapsedSecs);
          setTimeLeft(remaining);

          // Fetch previously saved answers
          const ansRes = await api.get(`/sessions/${sess._id}/answers`);
          if (ansRes.data.success) {
            const ansMap = {};
            const revMap = {};
            ansRes.data.answers.forEach(a => {
              ansMap[a.questionId] = a.selectedAnswer;
              revMap[a.questionId] = a.isMarkedForReview;
            });
            setAnswers(ansMap);
            setReviews(revMap);
          }

          // Join Socket room
          joinExamRoom(examId);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load examination.');
      } finally {
        setLoading(false);
      }
    };

    initExam();
  }, [examId]);

  // Countdown Timer
  useEffect(() => {
    if (!consentGiven || timeLeft <= 0 || !session || session.status === 'completed') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit(true); // Auto-submit when timer expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [consentGiven, timeLeft, session]);

  // Heartbeat ping via Socket.IO
  useEffect(() => {
    if (!session || !consentGiven) return;
    const hb = setInterval(() => {
      sendStudentHeartbeat({
        examId,
        studentId: user?.id,
        sessionId: session._id,
        timeLeft
      });
    }, 10000);
    return () => clearInterval(hb);
  }, [session, consentGiven, timeLeft]);

  // Browser Monitoring: Detect Tab Switch (blur / visibilitychange)
  useEffect(() => {
    if (!consentGiven || !session) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        setTabSwitchCount(prev => prev + 1);
        setTabSwitchWarning(true);

        try {
          // Log security event to backend
          await api.put(`/sessions/${session._id}/activity`, {
            isTabSwitch: true
          });
        } catch (e) {
          console.error('Failed to log tab switch:', e);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [consentGiven, session]);

  // Request Fullscreen
  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    }
  };

  // Explicit Candidate Consent Handler
  const handleGiveConsent = async () => {
    // Request webcam permission with explicit browser prompt
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setWebcamStatus('granted');
      // Stop stream immediately to only store verified permission status, as specified in guidelines
      stream.getTracks().forEach(track => track.stop());
    } catch (e) {
      setWebcamStatus('denied');
    }

    setConsentGiven(true);
    enterFullscreen();

    if (session) {
      api.put(`/sessions/${session._id}/activity`, {
        webcamPermissionStatus: webcamStatus === 'granted' ? 'granted' : 'denied'
      });
    }
  };

  // Save answer to backend
  const saveAnswerToBackend = async (questionId, selectedAnswer, isMarkedForReview) => {
    if (!session) return;
    setSaveStatus('Saving...');
    try {
      await api.post(`/sessions/${session._id}/save-answer`, {
        questionId,
        selectedAnswer,
        isMarkedForReview
      });
      setSaveStatus('Saved');
    } catch (err) {
      setSaveStatus('Error saving');
    }
  };

  const handleSelectOption = (qId, optionIndex) => {
    setAnswers(prev => ({ ...prev, [qId]: optionIndex }));
    saveAnswerToBackend(qId, optionIndex, !!reviews[qId]);
  };

  const handleToggleReview = (qId) => {
    const nextVal = !reviews[qId];
    setReviews(prev => ({ ...prev, [qId]: nextVal }));
    saveAnswerToBackend(qId, answers[qId], nextVal);
  };

  const handleClearAnswer = (qId) => {
    setAnswers(prev => {
      const updated = { ...prev };
      delete updated[qId];
      return updated;
    });
    saveAnswerToBackend(qId, null, !!reviews[qId]);
  };

  // Final Submit Handler
  const handleFinalSubmit = async (isAuto = false) => {
    setIsSubmitting(true);
    try {
      const res = await api.post(`/sessions/${session._id}/submit`, {
        isAutoSubmitted: isAuto
      });

      if (res.data.success) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        navigate(`/student/exam-confirmation/${session._id}`, {
          state: {
            score: res.data.session.score,
            totalMarks: exam.totalMarks,
            examTitle: exam.title,
            isAutoSubmitted: isAuto,
            submittedAt: res.data.session.submittedAt
          }
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit examination');
    } finally {
      setIsSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  const formatTimer = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? `${h.toString().padStart(2, '0')}:` : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-2xl border border-rose-200 shadow-sm text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Examination Access Restricted</h3>
        <p className="text-xs text-slate-500 mt-2">{error}</p>
        <button
          onClick={() => navigate('/student/dashboard')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
        >
          Return to Student Dashboard
        </button>
      </div>
    );
  }

  // Pre-Exam Consent Modal
  if (!consentGiven) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Academic Proctoring Consent</h2>
              <p className="text-xs text-slate-400">Institutional Examination Code of Conduct</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="font-semibold text-slate-800">Before beginning "{exam.title}":</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>You must maintain an uninterrupted fullscreen view during the session.</li>
              <li>Exiting fullscreen or switching browser tabs is automatically logged as a security event.</li>
              <li>Camera connection status will be verified; no covert recordings are stored.</li>
              <li>The exam will auto-finalize and submit when the countdown reaches 00:00:00.</li>
            </ul>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              onClick={() => navigate('/student/dashboard')}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel & Exit
            </button>
            <button
              onClick={handleGiveConsent}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-2"
            >
              <Maximize2 className="w-4 h-4" />
              <span>I Agree • Start Examination</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex] || {};
  const currentSelected = answers[currentQ._id];
  const isCurrentReviewed = !!reviews[currentQ._id];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col no-print -m-4 sm:-m-6 lg:-m-8">
      {/* Top Proctoring Header */}
      <header className="bg-navy-950 text-white px-4 sm:px-6 py-3 border-b border-navy-800 flex items-center justify-between sticky top-0 z-40">
        <div>
          <h1 className="text-sm font-bold tracking-tight text-white line-clamp-1">{exam.title}</h1>
          <p className="text-[11px] text-slate-400">
            Candidate: {user?.name} ({user?.studentId || 'N/A'}) • {saveStatus}
          </p>
        </div>

        {/* Live Countdown Timer & Submit */}
        <div className="flex items-center space-x-3">
          <div
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl font-mono text-sm font-bold border ${
              timeLeft < 300
                ? 'bg-rose-500/20 text-rose-300 border-rose-500 animate-pulse'
                : 'bg-navy-900 text-blue-300 border-navy-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTimer(timeLeft)}</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            Submit Paper
          </button>
        </div>
      </header>

      {/* Main Examination Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Active Question Card */}
        <div className="lg:col-span-3 flex flex-col justify-between bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div>
            {/* Question Header & Review Flag */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">Marks: {currentQ.marks || 1}</span>
                <button
                  onClick={() => handleToggleReview(currentQ._id)}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    isCurrentReviewed
                      ? 'bg-amber-50 text-amber-700 border-amber-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{isCurrentReviewed ? 'Marked for Review' : 'Mark for Review'}</span>
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div className="text-sm font-medium text-slate-800 leading-relaxed mb-6">
              {currentQ.questionText}
            </div>

            {/* Multiple Choice Options */}
            <div className="space-y-3">
              {currentQ.options?.map((opt, optIndex) => {
                const isSelected = currentSelected === optIndex;
                return (
                  <label
                    key={optIndex}
                    onClick={() => handleSelectOption(currentQ._id, optIndex)}
                    className={`flex items-center space-x-3 p-3.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-500 text-blue-900 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Navigation Toolbar */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-8">
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="flex items-center space-x-1.5 px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentSelected !== undefined && (
              <button
                onClick={() => handleClearAnswer(currentQ._id)}
                className="text-xs text-rose-500 hover:text-rose-700 font-medium"
              >
                Clear Response
              </button>
            )}

            <button
              onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
              disabled={currentIndex === questions.length - 1}
              className="flex items-center space-x-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold disabled:opacity-40 shadow-xs transition-colors"
            >
              <span>Next Question</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Question Navigation Palette & Proctoring Status */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Question Palette
            </h3>

            {/* Grid of question buttons */}
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = answers[q._id] !== undefined;
                const isReviewed = !!reviews[q._id];
                const isCurrent = idx === currentIndex;

                let btnBg = 'bg-slate-100 text-slate-700 border-slate-200';
                if (isAnswered && isReviewed) {
                  btnBg = 'bg-purple-600 text-white border-purple-600';
                } else if (isReviewed) {
                  btnBg = 'bg-amber-500 text-white border-amber-500';
                } else if (isAnswered) {
                  btnBg = 'bg-emerald-600 text-white border-emerald-600';
                }

                return (
                  <button
                    key={q._id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-xl font-bold text-xs border transition-all ${btnBg} ${
                      isCurrent ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-md bg-emerald-600" />
                <span>Answered ({Object.keys(answers).length})</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-md bg-amber-500" />
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-md bg-slate-200" />
                <span>Not Visited</span>
              </div>
            </div>
          </div>

          {/* Session Proctoring Telemetry Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs text-xs space-y-2">
            <h4 className="font-bold text-slate-700">Proctoring Telemetry</h4>
            <div className="flex items-center justify-between text-slate-600">
              <span>Fullscreen:</span>
              <span className="font-semibold text-emerald-600">Enforced</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Webcam Verification:</span>
              <span className="font-semibold capitalize text-blue-600">{webcamStatus}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Tab Switch Count:</span>
              <span className={`font-semibold ${tabSwitchCount > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                {tabSwitchCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switch Security Warning Modal */}
      {tabSwitchWarning && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center border border-rose-200 shadow-2xl">
            <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Security Warning: Tab Switch Detected</h3>
            <p className="text-xs text-slate-500 mt-2">
              You navigated away from the active examination window. This observation has been recorded in the central invigilator log.
            </p>
            <p className="text-[11px] font-semibold text-rose-600 mt-2">
              Total Occurrences: {tabSwitchCount}
            </p>
            <button
              onClick={() => {
                setTabSwitchWarning(false);
                enterFullscreen();
              }}
              className="mt-4 w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
            >
              Acknowledge & Return to Exam
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Before Final Submission */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-left border border-slate-200 shadow-2xl">
            <h3 className="text-base font-bold text-slate-800">Confirm Final Submission</h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to finalize your examination? Once submitted, you cannot modify your answers.
            </p>

            <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Questions:</span>
                <span className="font-bold">{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Answered Questions:</span>
                <span className="font-bold text-emerald-600">{Object.keys(answers).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Unanswered Questions:</span>
                <span className="font-bold text-rose-600">
                  {Math.max(0, questions.length - Object.keys(answers).length)}
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Back to Exam
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleFinalSubmit(false)}
                className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Yes, Submit Final Paper'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentExamInterface;
