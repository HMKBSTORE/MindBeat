import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

// Wrap the whole app with this so every page can read the logged-in
// student's profile (points, streak, class) without re-fetching it.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)       // Firebase auth user
  const [profile, setProfile] = useState(null) // Firestore student profile
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const snap = await getDoc(doc(db, 'students', firebaseUser.uid))
        if (snap.exists()) {
          const data = snap.data()
          setProfile({ id: firebaseUser.uid, ...data })
          await applyDailyStreakCheck(firebaseUser.uid, data)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function signup({ name, avatar, email, password }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    const newProfile = {
      name,
      avatar: avatar || '🦊',
      points: 0,
      streak: 0,
      longestStreak: 0,
      lastPlayedDate: null,
      badges: [],
      history: [],
      createdAt: serverTimestamp()
    }
    await setDoc(doc(db, 'students', cred.user.uid), newProfile)
    setProfile({ id: cred.user.uid, ...newProfile })
    return cred.user
  }

  async function login({ email, password }) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function logout() {
    await signOut(auth)
  }

  // Refresh the local profile copy after points/streak change elsewhere (e.g. after a quiz)
  async function refreshProfile() {
    if (!user) return
    const snap = await getDoc(doc(db, 'students', user.uid))
    if (snap.exists()) setProfile({ id: user.uid, ...snap.data() })
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signup, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

// Checks if the student already played today; if this is a new day,
// it does NOT increment the streak by itself — playing a quiz does that
// (see utils/gamification.js). This function only resets a broken streak to 0.
async function applyDailyStreakCheck(uid, data) {
  if (!data.lastPlayedDate) return
  const last = new Date(data.lastPlayedDate)
  const today = new Date()
  const diffDays = Math.floor((stripTime(today) - stripTime(last)) / 86400000)
  if (diffDays >= 2 && data.streak > 0) {
    await updateDoc(doc(db, 'students', uid), { streak: 0 })
  }
}

function stripTime(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

export function useAuth() {
  return useContext(AuthContext)
}
