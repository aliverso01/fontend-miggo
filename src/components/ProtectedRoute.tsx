import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/authHook";

export default function ProtectedRoute() {
    const { user, loading } = useAuth();

    // Or a loading spinner
    if (loading) return <div>Loading...</div>;

    return user ? <Outlet /> : <Navigate to="/signin" replace />;
}
