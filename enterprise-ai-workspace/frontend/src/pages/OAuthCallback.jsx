import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function OAuthCallback() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Signing you in…');

  useEffect(() => {
    // Read directly from window.location to avoid any React Router parsing issues
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (error) {
      setStatus('Login failed: ' + error);
      setTimeout(() => navigate('/login?error=' + error), 2000);
      return;
    }

    if (token) {
      try {
        login(token);
        navigate('/dashboard', { replace: true });
      } catch (e) {
        setStatus('Login error: ' + e.message);
        setTimeout(() => navigate('/login'), 2000);
      }
    } else {
      // Show the raw URL for debugging
      setStatus('No token found. URL: ' + window.location.href);
      setTimeout(() => navigate('/login'), 3000);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center text-white max-w-lg px-4">
        <Loader2 size={40} className="animate-spin mx-auto mb-4 text-indigo-400" />
        <p className="text-lg">{status}</p>
      </div>
    </div>
  );
}
