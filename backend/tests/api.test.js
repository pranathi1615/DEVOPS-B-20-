const http = require('http');
const { app, server } = require('../server');
const { connectDB, disconnectDB } = require('../config/db');
const { seedDatabase } = require('../utils/seedData');

const makeRequest = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          // keep as raw text (e.g. for CSV or PDF)
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
};

const runAllTests = async () => {
  console.log('\n======================================================');
  console.log('STARTING BACKEND API & INTEGRATION VERIFICATION TESTS');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      failed++;
    }
  };

  try {
    await connectDB();
    await seedDatabase();

    // Start server on a test port
    const TEST_PORT = 5099;
    await new Promise((res) => server.listen(TEST_PORT, res));
    console.log(`Test server active on port ${TEST_PORT}\n`);

    const baseOpts = {
      hostname: '127.0.0.1',
      port: TEST_PORT,
      headers: { 'Content-Type': 'application/json' }
    };

    // 1. Health check
    const health = await makeRequest({ ...baseOpts, path: '/api/health', method: 'GET' });
    assert(health.statusCode === 200 && health.data.status === 'healthy', 'GET /api/health returns 200 OK');

    // 2. Authentication - Admin Login
    const adminLogin = await makeRequest(
      { ...baseOpts, path: '/api/auth/login', method: 'POST' },
      { email: 'admin@examportal.edu', password: 'Admin@123' }
    );
    assert(adminLogin.statusCode === 200 && adminLogin.data.token, 'POST /api/auth/login (Admin) returns JWT token');
    const adminToken = adminLogin.data.token;

    // 3. Authentication - Student Login
    const studentLogin = await makeRequest(
      { ...baseOpts, path: '/api/auth/login', method: 'POST' },
      { email: 'student@examportal.edu', password: 'Student@123' }
    );
    assert(studentLogin.statusCode === 200 && studentLogin.data.user.role === 'student', 'POST /api/auth/login (Student) identifies role correctly');
    const studentToken = studentLogin.data.token;
    const studentUser = studentLogin.data.user;

    // 4. Role Authorization Security Test: Student attempts Admin endpoint
    const forbiddenTest = await makeRequest({
      ...baseOpts,
      path: '/api/users',
      method: 'GET',
      headers: { ...baseOpts.headers, Authorization: `Bearer ${studentToken}` }
    });
    assert(forbiddenTest.statusCode === 403, 'RBAC Security: Student blocked from Admin /api/users with 403 Forbidden');

    // 5. Admin fetches Users list
    const usersList = await makeRequest({
      ...baseOpts,
      path: '/api/users',
      method: 'GET',
      headers: { ...baseOpts.headers, Authorization: `Bearer ${adminToken}` }
    });
    assert(usersList.statusCode === 200 && usersList.data.users.length >= 5, 'GET /api/users (Admin) retrieves user directory');

    // 6. Examination listing for student (Answer masking security test)
    const studentExams = await makeRequest({
      ...baseOpts,
      path: '/api/exams',
      method: 'GET',
      headers: { ...baseOpts.headers, Authorization: `Bearer ${studentToken}` }
    });
    assert(studentExams.statusCode === 200 && studentExams.data.exams.length > 0, 'GET /api/exams retrieves student assigned exams');
    const firstExam = studentExams.data.exams[0];
    const hasExposedAnswer = firstExam.questions?.some(q => q.correctOptionIndex !== undefined);
    assert(!hasExposedAnswer, 'Exam Integrity: Student questions payload correctly masks correctOptionIndex');

    // 7. Student starts examination session
    const sessionStart = await makeRequest(
      {
        ...baseOpts,
        path: '/api/sessions/start',
        method: 'POST',
        headers: { ...baseOpts.headers, Authorization: `Bearer ${studentToken}` }
      },
      { examId: firstExam._id, webcamPermissionStatus: 'granted' }
    );
    assert(sessionStart.statusCode === 200 && sessionStart.data.session.status === 'in_progress', 'POST /api/sessions/start initiates live exam session');
    const activeSession = sessionStart.data.session;

    // 8. Student saves answer
    if (firstExam.questions && firstExam.questions.length > 0) {
      const qId = firstExam.questions[0]._id;
      const saveAns = await makeRequest(
        {
          ...baseOpts,
          path: `/api/sessions/${activeSession._id}/save-answer`,
          method: 'POST',
          headers: { ...baseOpts.headers, Authorization: `Bearer ${studentToken}` }
        },
        { questionId: qId, selectedAnswer: 1, isMarkedForReview: false }
      );
      assert(saveAns.statusCode === 200 && saveAns.data.answer.selectedAnswer === 1, 'POST /api/sessions/:id/save-answer saves answer response');
    }

    // 9. Browser monitoring event: Tab switch triggers automated Incident logging
    const tabSwitchEvent = await makeRequest(
      {
        ...baseOpts,
        path: `/api/sessions/${activeSession._id}/activity`,
        method: 'PUT',
        headers: { ...baseOpts.headers, Authorization: `Bearer ${studentToken}` }
      },
      { isTabSwitch: true }
    );
    assert(tabSwitchEvent.statusCode === 200 && tabSwitchEvent.data.incident !== null, 'Browser Monitoring: Tab switch detected and logged as security incident');

    // 10. Student submits examination
    const submitRes = await makeRequest(
      {
        ...baseOpts,
        path: `/api/sessions/${activeSession._id}/submit`,
        method: 'POST',
        headers: { ...baseOpts.headers, Authorization: `Bearer ${studentToken}` }
      },
      { isAutoSubmitted: false }
    );
    assert(submitRes.statusCode === 200 && submitRes.data.session.status === 'completed', 'POST /api/sessions/:id/submit finalizes exam session');

    // 11. Reports: Exam Session Summary (JSON & CSV)
    const summaryJson = await makeRequest({
      ...baseOpts,
      path: '/api/reports/exam-summary',
      method: 'GET',
      headers: { ...baseOpts.headers, Authorization: `Bearer ${adminToken}` }
    });
    assert(summaryJson.statusCode === 200 && summaryJson.data.summary.length > 0, 'GET /api/reports/exam-summary returns JSON metrics');

    const summaryCsv = await makeRequest({
      ...baseOpts,
      path: '/api/reports/exam-summary?format=csv',
      method: 'GET',
      headers: { ...baseOpts.headers, Authorization: `Bearer ${adminToken}` }
    });
    assert(summaryCsv.statusCode === 200 && typeof summaryCsv.data === 'string' && summaryCsv.data.includes('Examination Title'), 'GET /api/reports/exam-summary?format=csv exports valid CSV');

    // 12. Reports: Attendance Report (JSON & CSV)
    const attendanceJson = await makeRequest({
      ...baseOpts,
      path: '/api/reports/attendance',
      method: 'GET',
      headers: { ...baseOpts.headers, Authorization: `Bearer ${adminToken}` }
    });
    assert(attendanceJson.statusCode === 200 && attendanceJson.data.records.length > 0, 'GET /api/reports/attendance returns candidate attendance data');

    const attendanceCsv = await makeRequest({
      ...baseOpts,
      path: '/api/reports/attendance?format=csv',
      method: 'GET',
      headers: { ...baseOpts.headers, Authorization: `Bearer ${adminToken}` }
    });
    assert(attendanceCsv.statusCode === 200 && typeof attendanceCsv.data === 'string' && attendanceCsv.data.includes('Student ID'), 'GET /api/reports/attendance?format=csv exports valid CSV');

    // 13. Reports: Incident Register (JSON & CSV)
    const incidentJson = await makeRequest({
      ...baseOpts,
      path: '/api/reports/incidents',
      method: 'GET',
      headers: { ...baseOpts.headers, Authorization: `Bearer ${adminToken}` }
    });
    assert(incidentJson.statusCode === 200 && incidentJson.data.incidents.length > 0, 'GET /api/reports/incidents returns incident register entries');

    const incidentCsv = await makeRequest({
      ...baseOpts,
      path: '/api/reports/incidents?format=csv',
      method: 'GET',
      headers: { ...baseOpts.headers, Authorization: `Bearer ${adminToken}` }
    });
    assert(incidentCsv.statusCode === 200 && typeof incidentCsv.data === 'string' && incidentCsv.data.includes('Incident ID'), 'GET /api/reports/incidents?format=csv exports valid CSV');

    // 14. Reports: Submission Status Report (JSON & CSV)
    const submissionJson = await makeRequest({
      ...baseOpts,
      path: '/api/reports/submissions',
      method: 'GET',
      headers: { ...baseOpts.headers, Authorization: `Bearer ${adminToken}` }
    });
    assert(submissionJson.statusCode === 200 && submissionJson.data.submissions.length > 0, 'GET /api/reports/submissions returns student submissions');

    const submissionCsv = await makeRequest({
      ...baseOpts,
      path: '/api/reports/submissions?format=csv',
      method: 'GET',
      headers: { ...baseOpts.headers, Authorization: `Bearer ${adminToken}` }
    });
    assert(submissionCsv.statusCode === 200 && typeof submissionCsv.data === 'string' && submissionCsv.data.includes('Student Name'), 'GET /api/reports/submissions?format=csv exports valid CSV');

    // 15. Overview stats for Admin Dashboard
    const statsRes = await makeRequest({
      ...baseOpts,
      path: '/api/stats/overview',
      method: 'GET',
      headers: { ...baseOpts.headers, Authorization: `Bearer ${adminToken}` }
    });
    assert(statsRes.statusCode === 200 && statsRes.data.stats.totalUsers > 0, 'GET /api/stats/overview compiles aggregated metrics');

    console.log('\n======================================================');
    console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    server.close();
    await disconnectDB();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    server.close();
    await disconnectDB();
    process.exit(1);
  }
};

runAllTests();
