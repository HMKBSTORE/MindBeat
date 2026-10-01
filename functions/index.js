const { initializeApp } = require('firebase-admin/app')
const { FieldValue, getFirestore } = require('firebase-admin/firestore')
const { HttpsError, onCall } = require('firebase-functions/v2/https')
const { getDeviceRegistrationDecision, hashDeviceRegistrationId } = require('./deviceRegistration')

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