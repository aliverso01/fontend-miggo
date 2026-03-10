import { useNavigate } from "react-router";
import { useAuthContext } from "../context/AuthContext";

export const useAuth = () => {
    const {
        login: contextLogin,
        logout,
        user,
        loading,
        error,
        register: contextRegister,
        requestPasswordReset,
        confirmPasswordReset,
    } = useAuthContext();
    const navigate = useNavigate();

    const login = async (credentials: { email: string; password?: string }) => {
        try {
            await contextLogin(credentials);
            navigate("/");
        } catch (err) {
            console.error("Login failed in hook:", err);
        }
    };

    const register = async (data: { name: string; email: string; phone: string; password?: string }) => {
        try {
            await contextRegister(data);
            // Don't auto-navigate on register since account starts inactive
        } catch (err) {
            console.error("Registration failed in hook:", err);
            throw err; // Re-throw so SignUpForm can catch and display
        }
    };

    return { login, logout, user, loading, error, register, requestPasswordReset, confirmPasswordReset };
};
