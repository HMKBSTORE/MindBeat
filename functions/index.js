const { initializeApp } = require('firebase-admin/app')
const { FieldValue, getFirestore } = require('firebase-admin/firestore')
const { HttpsError, onCall } = require('firebase-functions/v2/https')
const { randomInt } = require('node:crypto')
const { getDeviceRegistrationDecision, hashDeviceRegistrationId } = require('./deviceRegistration')
const { REWARD_CONFIG } = require('./rewardsConfig')
const { createQuizAttemptId, dailyCheckInAvailableAt, scoreRewardQuiz, utcDateKey } = require('./rewardLogic')

initializeApp()
const db = getFirestore()
const enforceAppCheck = process.env.ENFORCE_APP_CHECK === 'true'

exports.initializeRewardAccount = onCall({ enforceAppCheck }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in to initialize reward eligibility.')
  }

  let deviceHash
  try {
    deviceHash = hashDeviceRegistrationId(request.data?.deviceRegistrationId)
  } catch {
    throw new HttpsError('invalid-argument', 'A valid device registration ID is required.')
  }

  const uid = request.auth.uid
  const studentRef = db.collection('students').doc(uid)
  const deviceRef = db.collection('registered_devices').doc(deviceHash)
  const riskRef = db.collection('device_risk_events').doc(`${uid}_${deviceHash}`)

  return db.runTransaction(async (transaction) => {
    const [studentSnapshot, deviceSnapshot] = await Promise.all([
      transaction.get(studentRef),
      transaction.get(deviceRef),
    ])

    if (!studentSnapshot.exists) {
      throw new HttpsError('failed-precondition', 'The MindBeat profile has not been created yet.')
    }

    const decision = getDeviceRegistrationDecision(
      deviceSnapshot.exists ? deviceSnapshot.data() : null,
      uid,
    )
    if (!decision.eligible) {
      if (decision.reason === 'device_conflict') {
        transaction.set(riskRef, {
          uid,
          deviceHash,
          reason: 'device_registered_to_another_account',
          createdAt: FieldValue.serverTimestamp(),
        }, { merge: true })
      }
      return decision
    }

    const now = FieldValue.serverTimestamp()
    if (deviceSnapshot.exists) {
      transaction.update(deviceRef, { lastSeenAt: now })
    } else {
      transaction.create(deviceRef, {
        uid,
        status: 'active',
        createdAt: now,
        lastSeenAt: now,
      })
    }

    const student = studentSnapshot.data()
    const walletPatch = {
      walletPoints: Number.isSafeInteger(student.walletPoints) && student.walletPoints >= 0
        ? student.walletPoints
        : 0,
      lockedPoints: Number.isSafeInteger(student.lockedPoints) && student.lockedPoints >= 0
        ? student.lockedPoints
        : 0,
      walletUpdatedAt: now,
    }
    if (!student.rewardAccountInitializedAt) {
      walletPatch.rewardAccountInitializedAt = now
    }

    transaction.set(studentRef, walletPatch, { merge: true })
    return {
      eligible: true,
      walletPoints: walletPatch.walletPoints,
      lockedPoints: walletPatch.lockedPoints,
    }
  })
})

exports.claimDailyCheckIn = onCall({ enforceAppCheck }, async (request) => {
  const uid = requireUid(request)
  const deviceHash = getRequestDeviceHash(request)
  const studentRef = db.collection('students').doc(uid)
  const deviceRef = db.collection('registered_devices').doc(deviceHash)
  const dateKey = utcDateKey(Date.now())
  const transactionRef = studentRef.collection('transactions').doc(`daily_checkin_${dateKey}`)

  return db.runTransaction(async (transaction) => {
    const [studentSnapshot, deviceSnapshot, claimSnapshot] = await Promise.all([
      transaction.get(studentRef),
      transaction.get(deviceRef),
      transaction.get(transactionRef),
    ])
    ensureRewardDevice(deviceSnapshot, uid)
    if (!studentSnapshot.exists) throw new HttpsError('failed-precondition', 'MindBeat profile was not found.')

    const student = studentSnapshot.data()
    const nowMs = Date.now()
    const lastCheckInMs = timestampToMillis(student.lastDailyCheckInAt)
    const availableAtMs = dailyCheckInAvailableAt(lastCheckInMs, 24 * 60 * 60 * 1000)
    if (claimSnapshot.exists || availableAtMs > nowMs) {
      return {
        eligible: false,
        reason: claimSnapshot.exists ? 'already_claimed' : 'cooldown',
        availableAtMs: Math.max(availableAtMs, nowMs),
        walletPoints: safePoints(student.walletPoints),
      }
    }

    const walletPoints = safePoints(student.walletPoints) + REWARD_CONFIG.DAILY_CHECKIN_POINTS
    transaction.update(studentRef, {
      walletPoints,
      lastDailyCheckInAt: FieldValue.serverTimestamp(),
      walletUpdatedAt: FieldValue.serverTimestamp(),
    })
    transaction.create(transactionRef, {
      type: 'daily_checkin',
      points: REWARD_CONFIG.DAILY_CHECKIN_POINTS,
      description: 'Daily check-in reward',
      createdAt: FieldValue.serverTimestamp(),
      referenceId: dateKey,
      status: 'completed',
    })
    return {
      eligible: true,
      pointsAwarded: REWARD_CONFIG.DAILY_CHECKIN_POINTS,
      walletPoints,
      availableAtMs: nowMs + 24 * 60 * 60 * 1000,
    }
  })
})

exports.startRewardQuiz = onCall({ enforceAppCheck }, async (request) => {
  const uid = requireUid(request)
  const deviceHash = getRequestDeviceHash(request)
  const categoryId = request.data?.categoryId
  if (typeof categoryId !== 'string' || !/^[a-zA-Z0-9_-]{1,40}$/.test(categoryId)) {
    throw new HttpsError('invalid-argument', 'A valid quiz category is required.')
  }

  const questionSnapshot = await db.collection('questions')
    .where('category', '==', categoryId)
    .get()
  const questionPool = questionSnapshot.docs
    .map((snapshot) => normalizeRewardQuestion(snapshot))
    .filter(Boolean)
  if (questionPool.length < 5) {
    throw new HttpsError('failed-precondition', 'At least five published questions are needed for a points-eligible quiz.')
  }

  const dateKey = utcDateKey(Date.now())
  const attemptId = createQuizAttemptId(uid, categoryId, dateKey)
  const attemptRef = db.collection('quiz_reward_attempts').doc(attemptId)
  const studentRef = db.collection('students').doc(uid)
  const deviceRef = db.collection('registered_devices').doc(deviceHash)
  const selectedQuestions = selectQuestions(questionPool, 5)

  return db.runTransaction(async (transaction) => {
    const [studentSnapshot, deviceSnapshot, attemptSnapshot] = await Promise.all([
      transaction.get(studentRef),
      transaction.get(deviceRef),
      transaction.get(attemptRef),
    ])
    ensureRewardDevice(deviceSnapshot, uid)
    if (!studentSnapshot.exists) throw new HttpsError('failed-precondition', 'MindBeat profile was not found.')

    if (attemptSnapshot.exists) {
      const attempt = attemptSnapshot.data()
      return { attemptId, questions: attempt.questions, status: attempt.status }
    }

    transaction.create(attemptRef, {
      uid,
      categoryId,
      dateKey,
      questions: selectedQuestions,
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
    })
    return { attemptId, questions: selectedQuestions, status: 'active' }
  })
})

exports.completeRewardQuiz = onCall({ enforceAppCheck }, async (request) => {
  const uid = requireUid(request)
  const deviceHash = getRequestDeviceHash(request)
  const attemptId = request.data?.attemptId
  if (typeof attemptId !== 'string' || !/^[a-f0-9]{64}$/.test(attemptId)) {
    throw new HttpsError('invalid-argument', 'The quiz attempt is invalid.')
  }

  const attemptRef = db.collection('quiz_reward_attempts').doc(attemptId)
  const studentRef = db.collection('students').doc(uid)
  const deviceRef = db.collection('registered_devices').doc(deviceHash)
  const transactionRef = studentRef.collection('transactions').doc(`quiz_${attemptId}`)

  return db.runTransaction(async (transaction) => {
    const [attemptSnapshot, studentSnapshot, deviceSnapshot, ledgerSnapshot] = await Promise.all([
      transaction.get(attemptRef),
      transaction.get(studentRef),
      transaction.get(deviceRef),
      transaction.get(transactionRef),
    ])
    ensureRewardDevice(deviceSnapshot, uid)
    if (!studentSnapshot.exists) throw new HttpsError('failed-precondition', 'MindBeat profile was not found.')
    if (!attemptSnapshot.exists || attemptSnapshot.get('uid') !== uid) {
      throw new HttpsError('not-found', 'The quiz attempt could not be found.')
    }

    const attempt = attemptSnapshot.data()
    if (attempt.status === 'completed') {
      return {
        eligible: attempt.pointsAwarded > 0,
        duplicate: true,
        pointsAwarded: attempt.pointsAwarded || 0,
        correct: attempt.correct || 0,
        total: attempt.questions.length,
        reason: attempt.completionReason || null,
      }
    }

    const createdAtMs = timestampToMillis(attempt.createdAt)
    const expiresAtMs = createdAtMs + REWARD_CONFIG.QUIZ_ATTEMPT_EXPIRY_MINUTES * 60 * 1000
    if (!createdAtMs || Date.now() > expiresAtMs) {
      throw new HttpsError('deadline-exceeded', 'This quiz attempt expired. Start another quiz to continue.')
    }
    if (ledgerSnapshot.exists) {
      throw new HttpsError('already-exists', 'This quiz reward has already been recorded.')
    }

    let score
    try {
      score = scoreRewardQuiz(attempt.questions, request.data?.answers, REWARD_CONFIG.QUIZ_REWARD_MIN_ACCURACY)
    } catch (error) {
      throw new HttpsError('invalid-argument', error.message)
    }

    const pointsAwarded = score.qualified ? REWARD_CONFIG.QUIZ_POINTS : 0
    const completionReason = score.qualified ? null : 'minimum_accuracy_not_met'
    transaction.update(attemptRef, {
      status: 'completed',
      correct: score.correct,
      pointsAwarded,
      completionReason,
      completedAt: FieldValue.serverTimestamp(),
    })

    if (pointsAwarded > 0) {
      const walletPoints = safePoints(studentSnapshot.get('walletPoints')) + pointsAwarded
      transaction.update(studentRef, {
        walletPoints,
        walletUpdatedAt: FieldValue.serverTimestamp(),
      })
      transaction.create(transactionRef, {
        type: 'quiz_reward',
        points: pointsAwarded,
        description: `${attempt.categoryId} quiz completion reward`,
        createdAt: FieldValue.serverTimestamp(),
        referenceId: attemptId,
        status: 'completed',
        metadata: { categoryId: attempt.categoryId, correct: score.correct, total: score.total },
      })
    }

    return {
      eligible: score.qualified,
      pointsAwarded,
      correct: score.correct,
      total: score.total,
      reason: completionReason,
    }
  })
})

function requireUid(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to use reward features.')
  return request.auth.uid
}

function getRequestDeviceHash(request) {
  try {
    return hashDeviceRegistrationId(request.data?.deviceRegistrationId)
  } catch {
    throw new HttpsError('invalid-argument', 'A valid device registration ID is required.')
  }
}

function ensureRewardDevice(snapshot, uid) {
  if (!snapshot.exists) {
    throw new HttpsError('permission-denied', 'Register this device before claiming reward points.')
  }
  const decision = getDeviceRegistrationDecision(snapshot.exists ? snapshot.data() : null, uid)
  if (!decision.eligible) {
    throw new HttpsError('permission-denied', 'This device is not eligible for reward points.')
  }
}

function safePoints(value) {
  if (value == null) return 0
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new HttpsError('failed-precondition', 'The reward wallet balance is invalid.')
  }
  return value
}

function timestampToMillis(value) {
  if (value && typeof value.toMillis === 'function') return value.toMillis()
  if (value instanceof Date) return value.getTime()
  return Number.isFinite(value) ? value : null
}

function normalizeRewardQuestion(snapshot) {
  const data = snapshot.data()
  if (
    typeof data.question !== 'string' ||
    !Array.isArray(data.options) ||
    data.options.length < 2 ||
    !data.options.every((option) => typeof option === 'string') ||
    !Number.isInteger(data.answer) ||
    data.answer < 0 ||
    data.answer >= data.options.length
  ) return null

  return { id: snapshot.id, question: data.question, options: data.options, answer: data.answer }
}

function selectQuestions(pool, count) {
  const shuffled = [...pool]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1)
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled.slice(0, count)
}
