const { createHash } = require('node:crypto')

function utcDateKey(timestampMs) {
  return new Date(timestampMs).toISOString().slice(0, 10)
}

function dailyCheckInAvailableAt(lastCheckInMs, intervalMs) {
  return lastCheckInMs == null ? 0 : lastCheckInMs + intervalMs
}

function createQuizAttemptId(uid, categoryId, dateKey) {
  return createHash('sha256').update(`${uid}:${categoryId}:${dateKey}`).digest('hex')
}

function scoreRewardQuiz(questions, submittedAnswers, minimumAccuracy) {
  if (!Array.isArray(questions) || questions.length !== 5 || !Array.isArray(submittedAnswers)) {
    throw new TypeError('The quiz attempt is invalid.')
  }
  if (submittedAnswers.length !== questions.length) {
    throw new TypeError('Every quiz question must have an answer.')
  }

  let correct = 0
  questions.forEach((question, index) => {
    const response = submittedAnswers[index]
    if (response?.questionId !== question.id || !Number.isInteger(response.answerIndex)) {
      throw new TypeError('Quiz answers do not match the issued attempt.')
    }
    if (response.answerIndex < -1 || response.answerIndex >= question.options.length) {
      throw new TypeError('A quiz answer is out of range.')
    }
    if (response.answerIndex === question.answer) correct += 1
  })

  const minimumCorrect = Math.ceil(questions.length * minimumAccuracy)
  return { correct, total: questions.length, qualified: correct >= minimumCorrect }
}

module.exports = {
  utcDateKey,
  dailyCheckInAvailableAt,
  createQuizAttemptId,
  scoreRewardQuiz,
}
