import { useNavigate } from "react-router";
import { useAuthContext } from "../context/AuthContext";

export const useAuth = () => {
    const { login: contextLogin, logout, user, loading, error, register: contextRegister } = useAuthContext();
    const navigate = useNavigate();

    const login = async (credentials: { email: string; password?: string }) => {
        try {
            await contextLogin(credentials);
            // Login successful, context state updated.
            // Navigate to dashboard.
            navigate("/");
        } catch (err) {
            // Error is stored in context and available via `error` property.
            // We can also let the error bubble up if the component wants to handle it specifically,
            // but usually binding UI to `error` state is enough.
            console.error("Login failed in hook:", err);
        }
    };

    const register = async (data: { name: string; email: string; password?: string }) => {
        try {
            await contextRegister(data);
            navigate("/");
        } catch (err) {
            console.error("Registration failed in hook:", err);
        }
    };

    return { login, logout, user, loading, error, register };
};
