const test = require('node:test')
const assert = require('node:assert/strict')
const {
  createQuizAttemptId,
  dailyCheckInAvailableAt,
  scoreRewardQuiz,
  utcDateKey,
} = require('./rewardLogic')

const quiz = Array.from({ length: 5 }, (_, index) => ({
  id: `question-${index}`,
  options: ['A', 'B', 'C', 'D'],
  answer: index % 4,
}))

test('uses UTC day keys for deterministic daily claims', () => {
  assert.equal(utcDateKey(Date.UTC(2026, 8, 29, 23, 59)), '2026-09-29')
  assert.equal(utcDateKey(Date.UTC(2026, 8, 30, 0, 0)), '2026-09-30')
  assert.equal(createQuizAttemptId('uid', 'gk', '2026-09-29'), createQuizAttemptId('uid', 'gk', '2026-09-29'))
  assert.notEqual(createQuizAttemptId('uid', 'gk', '2026-09-29'), createQuizAttemptId('uid', 'gk', '2026-09-30'))
})

test('check-in next eligible time is based on the stored server timestamp', () => {
  assert.equal(dailyCheckInAvailableAt(null, 86400000), 0)
  assert.equal(dailyCheckInAvailableAt(1000, 86400000), 86401000)
})

test('scores only complete answers that match the server-issued question order', () => {
  const answers = quiz.map((question) => ({ questionId: question.id, answerIndex: question.answer }))
  assert.deepEqual(scoreRewardQuiz(quiz, answers, 0.6), { correct: 5, total: 5, qualified: true })
  answers[4] = { questionId: quiz[4].id, answerIndex: -1 }
  assert.deepEqual(scoreRewardQuiz(quiz, answers, 0.6), { correct: 4, total: 5, qualified: true })
  answers[0] = { questionId: 'different-question', answerIndex: 0 }
  assert.throws(() => scoreRewardQuiz(quiz, answers, 0.6), /do not match/)
})

test('requires the configured minimum accuracy and rejects missing or out-of-range answers', () => {
  const answers = quiz.map((question, index) => ({ questionId: question.id, answerIndex: index === 0 ? question.answer : -1 }))
  assert.equal(scoreRewardQuiz(quiz, answers, 0.6).qualified, false)
  assert.throws(() => scoreRewardQuiz(quiz, answers.slice(1), 0.6), /Every quiz question/)
  answers[0].answerIndex = 5
  assert.throws(() => scoreRewardQuiz(quiz, answers, 0.6), /out of range/)
})
