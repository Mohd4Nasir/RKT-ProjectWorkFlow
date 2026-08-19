
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Eye, EyeOff, ShieldCheck, CheckCircle2, Lock, Mail, Info } from 'lucide-react';
import { useAuth } from '@/providers/KeycloakProvider';
import keycloak from '@/lib/keycloak';
import { useAppSelector } from '@/store';
import NetworkChainBackground from '@/components/NetworkChain';

export default function Login() {
  const navigate = useNavigate();
  const { initialized, authenticated } = useAuth();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [loading, setLoading] = useState(false);

  // Already logged in → dashboard
  useEffect(() => {
    if (authenticated || isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [authenticated, isAuthenticated, navigate]);

  const handleKeycloakLogin = () => {
    setLoading(true);
    keycloak.login({
      redirectUri: `${window.location.origin}/dashboard`
    });
  };
  const T = {
    navy: '#001858',
    para: '#172c66',
    pink: '#f582ae',
    peach: '#f3d2c1',
    teal: '#8bd3dd',
    white: '#fffffe',
  };
  // Loading state
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Setting up secure connection...</p>
        </div>
      </div>
    );
  }

  if (authenticated || isAuthenticated) return null;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Diagonal Background Split */}
      <div className="absolute inset-0 flex">
        {/* Left Diagonal Section - RishiKirti Brand Color */}
        <div
          className="w-1/2 bg-gradient-to-b from-[#241457] to-[#1a1a2e] relative"
          style={{ clipPath: 'polygon(0 0, 100% 0, 105% 100%, 0 84%)' }}
        >


          {/* Network-chain background with folder/file/briefcase icon nodes */}
          <NetworkChainBackground />


        </div>

        {/* Right Diagonal Section */}
        <div className="w-3/4 bg-[#E8E3F4] relative"
          style={{
            clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0 100%)'
          }}>
          <div className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(124, 58, 237, 0.05) 0%, transparent 50%)`
            }}>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex min-h-screen">
        {/* LEFT SECTION - RishiKirti Technologies Branding */}
        <div className="hidden lg:flex lg:w-2/5 items-center justify-center px-16 py-12">
          <div className="max-w-lg">
            {/* Logo */}
            <div className="flex ">
              <img
                src="/image.png"
                alt="RishiKirti Technologies Logo"
                width={250}
                height={300}
                className="rounded-xl  object-contain"
              />
            </div>

            <div>
              
              <p className="text-xl text-purple-200 mb-2">
                Project Management Platform
              </p>
              <p className="text-purple-300">
                Enterprise Solutions
              </p>
            </div>

            {/* Stats */}
            <div className="mt-12 flex gap-8">
              <div>
                <div className="text-2xl font-bold text-white">50+</div>
                <div className="text-sm text-gray-400">Projects Delivered</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">10+</div>
                <div className="text-sm text-gray-400">Happy Clients</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="text-sm text-gray-400">Support</div>
              </div>
            </div>

            {/* Features */}
            <div className="mt-12 space-y-3">
              <div className="flex items-center gap-3 text-gray-300">
                <CheckCircle2 size={16} className="text-purple-400" />
                <span className="text-sm">Enterprise-grade security</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <CheckCircle2 size={16} className="text-purple-400" />
                <span className="text-sm">Real-time collaboration</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <CheckCircle2 size={16} className="text-purple-400" />
                <span className="text-sm">Advanced analytics</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION - Login Form */}
        {/* RIGHT SECTION - Login Form */}
        <div
          className="relative z-[1] w-full md:w-[34%] lg:w-[30%] bg-white 
             flex items-center justify-center px-5 py-10 sm:px-6 sm:py-12 
             md:rounded-l-[24px] m-4 
             h-auto max-h-[80vh] md:max-h-[75vh] lg:max-h-[70vh]
             self-center overflow-hidden
             ml-auto mr-[5%] md:mr-[8%] lg:mr-[10%]"
        >
          {/* soft decorative tints, using the alpha-safe CSS vars */}
          <div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
            style={{ backgroundColor: 'hsl(var(--secondary-55))' }}
          />
          <div
            className="absolute -bottom-14 -left-10 w-48 h-48 rounded-full pointer-events-none"
            style={{ backgroundColor: 'hsl(var(--accent-55))' }}
          />

          <div className="relative z-[1] w-full max-w-[420px]">
            {/* Mobile-only logo (branding panel hidden below md) */}
            <div className="md:hidden flex flex-col items-center gap-3 mb-8">
              <div className="flex items-center gap-2">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: T.pink }}
                >
                  <Sparkles size={20} style={{ color: T.navy }} />
                </div>
                <div>
                  <h2 className="text-lg font-medium" style={{ color: T.navy }}>RishiKirti</h2>
                  <p className="text-xs" style={{ color: T.para, opacity: 0.7 }}>Technologies</p>
                </div>
              </div>
            </div>

            <h2 className="text-xl sm:text-[22px] font-medium mb-1.5" style={{ color: T.navy }}>
              Sign in to your workspace
            </h2>
            <p className="text-[13px] mb-6" style={{ color: T.para, opacity: 0.65 }}>
              Authenticate through your organization&apos;s identity provider.
            </p>

            <button
              onClick={handleKeycloakLogin}
              disabled={loading}
              className="w-full h-12 rounded-xl font-medium text-sm
                 hover:brightness-110 active:scale-[0.99]
                 disabled:opacity-60 disabled:cursor-not-allowed
                 transition-all duration-150
                 flex items-center justify-center gap-2.5"
              style={{ backgroundColor: T.navy, color: T.white }}
            >
              {loading ? (
                <>
                  <span
                    className="w-4 h-4 rounded-full animate-spin"
                    style={{ border: '2px solid rgba(255,255,255,0.3)', borderTopColor: T.white }}
                  />
                  Redirecting to Keycloak…
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  Continue with Keycloak SSO
                </>
              )}
            </button>

            <div
              className="mt-3.5 flex items-start gap-2.5 rounded-xl px-3.5 py-3"
              style={{ backgroundColor: 'hsl(var(--secondary-55))' }}
            >
              <Info size={14} className="mt-0.5 shrink-0" style={{ color: T.navy }} />
              <p className="text-[11px] leading-relaxed" style={{ color: T.para }}>
                Secured by Keycloak. No password is handled here — you&apos;ll authenticate with your identity provider.
              </p>
            </div>

            <div className="text-center mt-5">
              <Link
                to="/forgot-password"
                className="text-[12.5px] hover:opacity-75 transition-opacity"
                style={{ color: T.navy }}
              >
                Forgot password?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


