import { useEffect, useState } from 'react';
import keycloak from '@/lib/keycloak';

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 🔑 IMPORTANT: Current URL से code निकालकर token लेना
        // Keycloak.js अपने आप यह कर लेता है अगर हम सही method call करें
        
        const currentUrl = window.location.href;
        
        // Method 1: Agar aap keycloak-js use kar rahe ho
        // Ye automatically URL se code parse karega aur token fetch karega
        await keycloak.loginCallback(currentUrl);
        
        // Method 2: Agar upar wala kaam na kare to manual way
        // const urlParams = new URLSearchParams(window.location.search);
        // const code = urlParams.get('code');
        // if (code) {
        //   await keycloak.token = code; // Actual implementation complex hai
        // }

        // ✅ Success: Parent window ko notify karein
        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'KEYCLOAK_LOGIN_SUCCESS',
            },
            window.location.origin
          );
          
          // 🎯 Thoda delay karke popup band karein taaki message deliver ho jaye
          setTimeout(() => {
            window.close();
          }, 500);
        } else {
          // Agar direct callback page open hua (popup nahi)
          window.location.href = '/dashboard';
        }
        
      } catch (err) {
        console.error('Auth callback failed:', err);
        setError('Login failed. Please try again.');
        
        // Parent window ko error notify karein
        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'KEYCLOAK_LOGIN_ERROR',
              error: String(err),
            },
            window.location.origin
          );
          
          setTimeout(() => {
            window.close();
          }, 1000);
        }
      }
    };

    handleCallback();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center space-y-4">
          <div className="text-red-600 text-xl">❌ {error}</div>
          <button 
            onClick={() => window.close()}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <div className="text-muted-foreground">Completing login, please wait...</div>
      </div>
    </div>
  );
}