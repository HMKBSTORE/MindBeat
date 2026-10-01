const { createHash } = require('node:crypto')

const DEVICE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function validateDeviceRegistrationId(value) {
  return typeof value === 'string' && DEVICE_ID_PATTERN.test(value)
}

function hashDeviceRegistrationId(value) {
  if (!validateDeviceRegistrationId(value)) {
    throw new TypeError('Invalid device registration ID.')
  }
  return createHash('sha256').update(value.toLowerCase()).digest('hex')
}

function getDeviceRegistrationDecision(existingDevice, uid) {
  if (!existingDevice) return { eligible: true }
  if (existingDevice.uid !== uid) return { eligible: false, reason: 'device_conflict' }
  if (existingDevice.status !== 'active') return { eligible: false, reason: 'device_blocked' }
  return { eligible: true }
}

module.exports = {
  validateDeviceRegistrationId,
  hashDeviceRegistrationId,
  getDeviceRegistrationDecision,
}
