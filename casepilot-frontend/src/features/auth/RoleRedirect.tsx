import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function RoleRedirect() {
  const { isAdmin } = useAuth();

  // Admin → admin panel, Lawyer → cases list
  return isAdmin
    ? <Navigate to="/app/admin/utilizatori" replace />
    : <Navigate to="/app/dosare" replace />;
}
