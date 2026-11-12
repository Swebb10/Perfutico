import { createContext, useContext, useEffect, useState } from "react";
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../lib/firebase";

const Context = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!auth) { setLoading(false); return undefined; }
    return onAuthStateChanged(auth, async (current) => {
      setUser(current);
      setIsAdmin(false);
      if (current && db) {
        try {
          const claim = await getDoc(doc(db, "admins", current.uid));
          setIsAdmin(claim.exists() && claim.data().role === "admin");
        } catch { setIsAdmin(false); }
      }
      setLoading(false);
    });
  }, []);
  const configured = () => { if (!auth) throw new Error("Conecta Firebase para activar las cuentas."); };
  const value = {
    user, isAdmin, loading,
    login: (email, password) => { configured(); return signInWithEmailAndPassword(auth, email, password); },
    register: (email, password) => { configured(); return createUserWithEmailAndPassword(auth, email, password); },
    google: () => { configured(); return signInWithPopup(auth, googleProvider); },
    logout: () => auth ? signOut(auth) : Promise.resolve(),
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useAuth = () => useContext(Context);
