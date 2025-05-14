import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute = () => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const is_admin = user?.is_admin;
  
  return token ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
