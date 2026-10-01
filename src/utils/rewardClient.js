import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'

export async function callRewardFunction(name, payload = {}) {
  const deviceRegistrationId = getDeviceRegistrationId()
  if (!deviceRegistrationId) {
    throw new Error('This browser cannot securely store its reward-device registration.')
  }

  const callable = httpsCallable(functions, name)
  const response = await callable({ ...payload, deviceRegistrationId })
  return response.data
}

function getDeviceRegistrationId() {
  const storageKey = 'mindbeat:reward-device-id'
  try {
    const existing = localStorage.getItem(storageKey)
    if (existing) return existing
    const generated = crypto.randomUUID()
    localStorage.setItem(storageKey, generated)
    return generated
  } catch {
    return null
  }
}
