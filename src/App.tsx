import { Suspense, lazy, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { store, persistor, useAppSelector } from '@/store';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import NotFound from "./pages/NotFound";

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const Projects = lazy(() => import('./pages/projects/Projects'));
const ProjectDetails = lazy(() => import('./pages/projects/ProjectDetails'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Users = lazy(() => import('./pages/Users'));
const Reports = lazy(() => import('./pages/Reports'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Files = lazy(() => import('./pages/Files'));

const queryClient = new QueryClient();

function ThemeBoot() {
  const theme = useAppSelector((s) => s.ui.theme);
  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); }, [theme]);
  return null;
}

const PageFallback = () => (
  <div className="min-h-screen grid place-items-center text-muted-foreground text-sm">Loading…</div>
);

const App = () => (
  <Provider store={store}>
  
    <PersistGate loading={null} persistor={persistor}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner position="top-right" />
          <BrowserRouter>
            <ThemeBoot />
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/projects" element={<ProtectedRoute roles={['admin']}><Projects /></ProtectedRoute>} />
                  <Route path="/projects/:id" element={<ProjectDetails />} />
                  <Route path="/my-projects" element={<Projects mine />} />
                  <Route path="/tasks" element={<ProtectedRoute roles={['admin']}><Tasks /></ProtectedRoute>} />
                  <Route path="/my-tasks" element={<Tasks mine />} />
                  <Route path="/users" element={<ProtectedRoute roles={['admin']}><Users /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute roles={['admin']}><Reports /></ProtectedRoute>} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/files" element={<Files />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </PersistGate>
  </Provider>
);

export default App;
