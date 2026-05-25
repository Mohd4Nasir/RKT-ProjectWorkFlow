import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store';
import { UserRole } from '@/types';

interface Props { children: JSX.Element; roles?: UserRole[]; }
export function ProtectedRoute({ children, roles }: Props) {
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const location = useLocation();
  if (!isAuthenticated || !user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}
