import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";


interface User {
    id: number;
    last_login: string;
    is_superuser: boolean;
    hash: string;
    email: string;
    name: string;
    phone: string | null;
    role: string;
    created_at: string;
    is_staff: boolean;
    is_active: boolean;
    groups: any[];
    user_permissions: any[];
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    login: (credentials: { email: string; password?: string }) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
    register: (data: { name: string; email: string; password?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse user from local storage", e);
                localStorage.removeItem("user");
            }
        }
        setLoading(false);
    }, []);

    const login = async (credentials: { email: string; password?: string }) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(
                "/api/v1/account/login/",
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Api-Key vxQRQtgZ.M9ppHygHa4hS32hnkTshmm1kxTD3qCSS",
                    },
                    body: JSON.stringify(credentials),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                // Try to get specific error message
                const msg = errorData.detail || (errorData.non_field_errors ? errorData.non_field_errors[0] : "Login failed");
                throw new Error(msg);
            }

            const data = await response.json();
            console.log("Login success data:", data);

            if (data.user) {
                setUser(data.user);
                localStorage.setItem("user", JSON.stringify(data.user));
            } else {
                throw new Error("Invalid response structure");
            }

        } catch (err: any) {
            const msg = err.message || "An error occurred during login";
            setError(msg);
            console.error("Login error:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await fetch("/api/v1/account/logout/", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Api-Key vxQRQtgZ.M9ppHygHa4hS32hnkTshmm1kxTD3qCSS",
                },
            });
        } catch (e) {
            console.error("Logout API call failed", e);
        } finally {
            setUser(null);
            localStorage.removeItem("user");
        }
    };

    const updateProfile = async (data: Partial<User>) => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(
                `/api/v1/account/update/${user.id}/`,
                {
                    method: "PATCH",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Api-Key vxQRQtgZ.M9ppHygHa4hS32hnkTshmm1kxTD3qCSS",
                    },
                    body: JSON.stringify(data),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || "Update failed");
            }

            const updatedUser = await response.json();
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser)); // Keep persistence in sync
        } catch (err: any) {
            setError(err.message || "Failed to update profile");
            console.error("Update profile error:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const register = async (data: { name: string; email: string; password?: string }) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(
                "/api/v1/account/register/",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Api-Key vxQRQtgZ.M9ppHygHa4hS32hnkTshmm1kxTD3qCSS",
                    },
                    body: JSON.stringify(data),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const msg = errorData.detail || (errorData.error ? String(errorData.error) : "Registration failed");
                throw new Error(msg);
            }

            const responseData = await response.json();
            // Assuming registration returns token or user similar to login, or just success
            // If it logs in automatically:
            if (responseData.user) {
                setUser(responseData.user);
                localStorage.setItem("user", JSON.stringify(responseData.user));
            }
            return responseData;

        } catch (err: any) {
            const msg = err.message || "An error occurred during registration";
            setError(msg);
            console.error("Registration error:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, error, login, logout, updateProfile, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuthContext must be used within an AuthProvider");
    }
    return context;
};
