// // import { useState } from 'react';
// // import { Navigate, useNavigate } from 'react-router-dom';
// // import { Sparkles, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
// // import { useAppDispatch, useAppSelector } from '@/store';
// // import { loginThunk } from '@/store/slices/authSlice';
// // import { Button } from '@/components/ui/button';
// // import { Input } from '@/components/ui/input';
// // import { Label } from '@/components/ui/label';
// // import { toast } from 'sonner';

// // export default function Login() {
// //   const dispatch = useAppDispatch();
// //   const navigate = useNavigate();
// //   const { isAuthenticated, loading, error } = useAppSelector((s) => s.auth);
// //   const [email, setEmail] = useState('admin@rishikirti.com');
// //   const [password, setPassword] = useState('admin123');
// //   const [showPw, setShowPw] = useState(false);

// //   if (isAuthenticated) return <Navigate to="/dashboard" replace />;

// //   const submit = async (e: React.FormEvent) => {
// //     e.preventDefault();
// //     const ok = await (dispatch as any)(loginThunk(email, password));
// //     if (ok) {
// //       toast.success('Welcome back!');
// //       navigate('/dashboard');
// //     } else {
// //       toast.error('Invalid credentials');
// //     }
// //   };

// //   const fill = (kind: 'admin' | 'user') => {
// //     if (kind === 'admin') { setEmail('admin@rishikirti.com'); setPassword('admin123'); }
// //     else { setEmail('user@rishikirti.com'); setPassword('user123'); }
// //   };

// //   return (
// //     <div className="min-h-screen grid lg:grid-cols-2 bg-background">
// //       {/* Left: brand */}
// //       <div className="hidden lg:flex relative bg-gradient-primary text-primary-foreground p-12 flex-col justify-between overflow-hidden">
// //         <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-white/10 blur-3xl" />
// //         <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-white/10 blur-3xl" />

// //         <div className="flex items-center gap-3 relative">
// //           <div className="h-11 w-11 rounded-xl bg-white/20 backdrop-blur grid place-items-center">
// //             <Sparkles className="h-6 w-6" />
// //           </div>
// //           <div>
// //             <div className="font-display font-bold text-xl">RishiKirti Projects</div>
// //             <div className="text-xs opacity-80">Enterprise Project Management Suite</div>
// //           </div>
// //         </div>

// //         <div className="relative space-y-6">
// //           <h2 className="font-display text-4xl xl:text-5xl font-bold leading-tight">
// //             Where teams turn ambitious projects into measurable outcomes.
// //           </h2>
// //           <p className="opacity-90 text-base max-w-md">
// //             Plan sprints, track SLAs, manage workflows and ship faster — all from a single, beautifully designed workspace.
// //           </p>
// //           <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/20">
// //             {[
// //               { k: '180+', v: 'Active orgs' },
// //               { k: '12k', v: 'Projects shipped' },
// //               { k: '99.9%', v: 'Uptime SLA' },
// //             ].map((s) => (
// //               <div key={s.v}>
// //                 <div className="font-display font-bold text-2xl">{s.k}</div>
// //                 <div className="text-xs opacity-80">{s.v}</div>
// //               </div>
// //             ))}
// //           </div>
// //         </div>

// //         <div className="text-xs opacity-70 relative">© {new Date().getFullYear()} RishiKirti Inc.</div>
// //       </div>

// //       {/* Right: form */}
// //       <div className="flex items-center justify-center p-6 sm:p-12">
// //         <div className="w-full max-w-md">
// //           <div className="lg:hidden flex items-center gap-3 mb-8">
// //             <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center">
// //               <Sparkles className="h-5 w-5 text-primary-foreground" />
// //             </div>
// //             <div>
// //               <div className="font-display font-bold">RishiKirti Projects</div>
// //             </div>
// //           </div>

// //           <h1 className="font-display text-3xl font-bold mb-1">Welcome back</h1>
// //           <p className="text-sm text-muted-foreground mb-8">Sign in to continue managing your work.</p>

// //           <form onSubmit={submit} className="space-y-4">
// //             <div className="space-y-2">
// //               <Label htmlFor="email">Email</Label>
// //               <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
// //             </div>
// //             <div className="space-y-2">
// //               <div className="flex justify-between">
// //                 <Label htmlFor="password">Password</Label>
// //                 <button type="button" className="text-xs text-primary hover:text-primary-hover font-semibold">Forgot?</button>
// //               </div>
// //               <div className="relative">
// //                 <Input id="password" type={showPw ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pr-10" />
// //                 <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
// //                   {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
// //                 </button>
// //               </div>
// //             </div>
// //             {error && <div className="text-xs text-danger">{error}</div>}
// //             <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-primary hover:opacity-95 shadow-glow text-base font-semibold">
// //               {loading ? 'Signing in…' : <>Sign in <ArrowRight className="h-4 w-4 ml-1" /></>}
// //             </Button>
// //           </form>

// //           <div className="mt-8 p-4 rounded-xl bg-primary-soft/40 border border-primary/10">
// //             <div className="flex items-center gap-2 text-xs font-semibold text-primary-hover mb-2">
// //               <ShieldCheck className="h-4 w-4" /> Demo accounts
// //             </div>
// //             <div className="grid grid-cols-2 gap-2">
// //               <button type="button" onClick={() => fill('admin')} className="p-2 rounded-lg bg-card hover:bg-card/80 border border-border text-left text-xs">
// //                 <div className="font-semibold">Admin</div>
// //                 <div className="text-muted-foreground truncate">admin@rishikirti.com</div>
// //               </button>
// //               <button type="button" onClick={() => fill('user')} className="p-2 rounded-lg bg-card hover:bg-card/80 border border-border text-left text-xs">
// //                 <div className="font-semibold">User</div>
// //                 <div className="text-muted-foreground truncate">user@rishikirti.com</div>
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }




// // import { useState } from 'react';
// // import { Navigate, useNavigate } from 'react-router-dom';
// // import { Sparkles, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
// // import { useAppDispatch, useAppSelector } from '@/store';
// // import { loginThunk } from '@/store/slices/authSlice';
// // import { Button } from '@/components/ui/button';
// // import { Input } from '@/components/ui/input';
// // import { Label } from '@/components/ui/label';
// // import { toast } from 'sonner';

// // export default function Login() {
// //   const dispatch = useAppDispatch();
// //   const navigate = useNavigate();
// //   const { isAuthenticated, loading, error } = useAppSelector((s) => s.auth);
// //   const [email, setEmail] = useState('admin@rishikirti.com');
// //   const [password, setPassword] = useState('admin123');
// //   const [showPw, setShowPw] = useState(false);

// //   if (isAuthenticated) return <Navigate to="/dashboard" replace />;

// //   const submit = async (e: React.FormEvent) => {
// //     e.preventDefault();
// //     const ok = await (dispatch as any)(loginThunk(email, password));
// //     if (ok) {
// //       toast.success('Welcome back!');
// //       navigate('/dashboard');
// //     } else {
// //       toast.error('Invalid credentials');
// //     }
// //   };

// //   const fill = (kind: 'admin' | 'user') => {
// //     if (kind === 'admin') { setEmail('admin@rishikirti.com'); setPassword('admin123'); }
// //     else { setEmail('user@rishikirti.com'); setPassword('user123'); }
// //   };

// //   return (
// //     <div className="min-h-screen grid lg:grid-cols-2 bg-background">
// //       {/* Left: brand */}
// //       <div className="hidden lg:flex relative bg-gradient-primary text-primary-foreground p-12 flex-col justify-between overflow-hidden">
// //         <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-white/10 blur-3xl" />
// //         <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-white/10 blur-3xl" />

// //         <div className="flex items-center gap-3 relative">
// //           <div className="h-11 w-11 rounded-xl bg-white/20 backdrop-blur grid place-items-center">
// //             <Sparkles className="h-6 w-6" />
// //           </div>
// //           <div>
// //             <div className="font-display font-bold text-xl">RishiKirti Projects</div>
// //             <div className="text-xs opacity-80">Enterprise Project Management Suite</div>
// //           </div>
// //         </div>

// //         <div className="relative space-y-6">
// //           <h2 className="font-display text-4xl xl:text-5xl font-bold leading-tight">
// //             Where teams turn ambitious projects into measurable outcomes.
// //           </h2>
// //           <p className="opacity-90 text-base max-w-md">
// //             Plan sprints, track SLAs, manage workflows and ship faster — all from a single, beautifully designed workspace.
// //           </p>
// //           <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/20">
// //             {[
// //               { k: '180+', v: 'Active orgs' },
// //               { k: '12k', v: 'Projects shipped' },
// //               { k: '99.9%', v: 'Uptime SLA' },
// //             ].map((s) => (
// //               <div key={s.v}>
// //                 <div className="font-display font-bold text-2xl">{s.k}</div>
// //                 <div className="text-xs opacity-80">{s.v}</div>
// //               </div>
// //             ))}
// //           </div>
// //         </div>

// //         <div className="text-xs opacity-70 relative">© {new Date().getFullYear()} RishiKirti Inc.</div>
// //       </div>

// //       {/* Right: form */}
// //       <div className="flex items-center justify-center p-6 sm:p-12">
// //         <div className="w-full max-w-md">
// //           <div className="lg:hidden flex items-center gap-3 mb-8">
// //             <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center">
// //               <Sparkles className="h-5 w-5 text-primary-foreground" />
// //             </div>
// //             <div>
// //               <div className="font-display font-bold">RishiKirti Projects</div>
// //             </div>
// //           </div>

// //           <h1 className="font-display text-3xl font-bold mb-1">Welcome back</h1>
// //           <p className="text-sm text-muted-foreground mb-8">Sign in to continue managing your work.</p>

// //           <form onSubmit={submit} className="space-y-4">
// //             <div className="space-y-2">
// //               <Label htmlFor="email">Email</Label>
// //               <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
// //             </div>
// //             <div className="space-y-2">
// //               <div className="flex justify-between">
// //                 <Label htmlFor="password">Password</Label>
// //                 <button type="button" className="text-xs text-primary hover:text-primary-hover font-semibold">Forgot?</button>
// //               </div>
// //               <div className="relative">
// //                 <Input id="password" type={showPw ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pr-10" />
// //                 <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
// //                   {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
// //                 </button>
// //               </div>
// //             </div>
// //             {error && <div className="text-xs text-danger">{error}</div>}
// //             <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-primary hover:opacity-95 shadow-glow text-base font-semibold">
// //               {loading ? 'Signing in…' : <>Sign in <ArrowRight className="h-4 w-4 ml-1" /></>}
// //             </Button>
// //           </form>

// //           <div className="mt-8 p-4 rounded-xl bg-primary-soft/40 border border-primary/10">
// //             <div className="flex items-center gap-2 text-xs font-semibold text-primary-hover mb-2">
// //               <ShieldCheck className="h-4 w-4" /> Demo accounts
// //             </div>
// //             <div className="grid grid-cols-2 gap-2">
// //               <button type="button" onClick={() => fill('admin')} className="p-2 rounded-lg bg-card hover:bg-card/80 border border-border text-left text-xs">
// //                 <div className="font-semibold">Admin</div>
// //                 <div className="text-muted-foreground truncate">admin@rishikirti.com</div>
// //               </button>
// //               <button type="button" onClick={() => fill('user')} className="p-2 rounded-lg bg-card hover:bg-card/80 border border-border text-left text-xs">
// //                 <div className="font-semibold">User</div>
// //                 <div className="text-muted-foreground truncate">user@rishikirti.com</div>
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }


import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Eye, EyeOff, ShieldCheck, CheckCircle2, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/providers/KeycloakProvider';
import keycloak from '@/lib/keycloak';
import { useAppSelector } from '@/store';

export default function Login() {
  const navigate = useNavigate();
  const { initialized, authenticated } = useAuth();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

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
        <div className="w-1/2 bg-gradient-to-b from-[#241457] to-[#1a1a2e] relative"
          style={{
            clipPath: 'polygon(0 0, 100% 0, 105% 100%, 0 84%)'
          }}>
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,0.05) 40px, rgba(255,255,255,0.05) 80px)`
            }}>
          </div>
          <div className="absolute bottom-40 right-20 w-64 h-64 border-4 border-white/5 rounded-full"></div>
          <div className="absolute top-40 left-20 w-32 h-32 border-4 border-white/5 rounded-full"></div>
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
            <div className="flex">
              <img
                src="/image.png"
                alt="RishiKirti Technologies Logo"
                width={400}
                height={500}
                className="rounded-xl object-contain"
              />
            </div>

            {/* Welcome Text */}
            <div className="mt-2">
              <h2 className="text-5xl font-bold mb-4 leading-tight text-white">
                Welcome Back!
              </h2>
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
                <div className="text-2xl font-bold text-white">500+</div>
                <div className="text-sm text-gray-400">Projects Delivered</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">100+</div>
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
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex flex-col items-center gap-3 mb-8">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">RishiKirti</h1>
                  <p className="text-xs text-gray-500">Technologies</p>
                </div>
              </div>
            </div>

            {/* Form Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Sign in to your account
              </h2>
              <p className="text-sm text-gray-500">
                Access your RishiKirti workspace with SSO
              </p>
            </div>

            {/* Keycloak Login Button */}
            <button
              onClick={handleKeycloakLogin}
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white rounded-lg font-medium hover:from-[#6C4BAE] hover:to-[#6C4BAE] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Redirecting to Keycloak...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-5 w-5" />
                  Continue with Keycloak SSO
                </>
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#E8E3F4] text-gray-500">OR</span>
              </div>
            </div>

            {/* Info Box */}
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 mb-2">
                <ShieldCheck className="h-4 w-4" />
                Secured by Keycloak
              </div>
              <p className="text-xs text-purple-600">
                Your organization uses Keycloak for secure single sign-on. 
                You'll be redirected to your identity provider to authenticate.
              </p>
            </div>

            {/* Forgot Password Link */}
            <div className="mt-6 text-center">
              <Link to="/forgot-password" className="text-sm text-purple-600 hover:text-purple-800">
                Forgot password?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


