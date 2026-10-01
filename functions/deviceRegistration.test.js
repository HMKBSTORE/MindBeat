const test = require('node:test')
const assert = require('node:assert/strict')
const {
  getDeviceRegistrationDecision,
  hashDeviceRegistrationId,
  validateDeviceRegistrationId,
} = require('./deviceRegistration')

test('validates generated UUID v4 installation IDs', () => {
  assert.equal(validateDeviceRegistrationId('9d26e66d-1640-4e42-8e2f-7024a71380f2'), true)
  assert.equal(validateDeviceRegistrationId('not-a-device-id'), false)
  assert.equal(validateDeviceRegistrationId(null), false)
})

test('hashes registration IDs deterministically without storing the raw ID', () => {
  const first = hashDeviceRegistrationId('9d26e66d-1640-4e42-8e2f-7024a71380f2')
  const same = hashDeviceRegistrationId('9D26E66D-1640-4E42-8E2F-7024A71380F2')
  const different = hashDeviceRegistrationId('9d26e66d-1640-4e42-8e2f-7024a71380f3')

  assert.equal(first, same)
  assert.notEqual(first, different)
  assert.match(first, /^[0-9a-f]{64}$/)
})

test('rejects malformed IDs before hashing', () => {
  assert.throws(() => hashDeviceRegistrationId('../../students/victim'), TypeError)
})

test('allows first registration and same-account active sessions only', () => {
  assert.deepEqual(getDeviceRegistrationDecision(null, 'user-a'), { eligible: true })
  assert.deepEqual(getDeviceRegistrationDecision({ uid: 'user-a', status: 'active' }, 'user-a'), { eligible: true })
  assert.deepEqual(getDeviceRegistrationDecision({ uid: 'user-b', status: 'active' }, 'user-a'), {
    eligible: false,
    reason: 'device_conflict',
  })
  assert.deepEqual(getDeviceRegistrationDecision({ uid: 'user-a', status: 'blocked' }, 'user-a'), {
    eligible: false,
    reason: 'device_blocked',
  })
})
