// components/AdminRoute.jsx
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) return <Navigate to="/" />;

  return role === 'admin' ? children : <Navigate to="/" />;
};

export default AdminRoute;