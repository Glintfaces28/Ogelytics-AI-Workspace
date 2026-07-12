import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

function userFromToken(accessToken) {
  if (!accessToken) return null;

  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    // Check if token is expired
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return {
      id: payload.user_id,
      email: payload.sub,
      username: payload.sub?.split('@')[0] || 'User',
      is_admin: payload.is_admin === true,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const storedToken = localStorage.getItem('token');
  // Clear expired token from storage immediately
  const validUser = userFromToken(storedToken);
  if (storedToken && !validUser) localStorage.removeItem('token');
  const [token, setToken] = useState(validUser ? storedToken : null);
  const [user, setUser] = useState(validUser);

  function login(accessToken, username) {
    const userData = userFromToken(accessToken);
    if (username && userData) userData.username = username;
    localStorage.setItem('token', accessToken);
    setToken(accessToken);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
