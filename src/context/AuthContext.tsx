import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Helper: converte respostas de erro do DRF em mensagem legível em português
const FIELD_LABELS: Record<string, string> = {
    email: "E-mail",
    password: "Senha",
    phone: "Telefone",
    name: "Nome",
    non_field_errors: "",
};

function parseDRFError(errorData: Record<string, any>): string {
    if (!errorData || typeof errorData !== "object") return "Ocorreu um erro inesperado.";

    // Mensagem direta no campo 'detail' ou 'message'
    if (typeof errorData.detail === "string") return errorData.detail;
    if (typeof errorData.message === "string") return errorData.message;

    const messages: string[] = [];

    for (const [field, value] of Object.entries(errorData)) {
        const label = FIELD_LABELS[field] ?? field;
        const errors = Array.isArray(value) ? value : [String(value)];
        for (const err of errors) {
            const msg = typeof err === "string" ? err : JSON.stringify(err);
            messages.push(label ? `${label}: ${msg}` : msg);
        }
    }

    return messages.length > 0 ? messages.join("\n") : "Erro ao processar a requisição.";
}


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
    register: (data: { name: string; email: string; phone: string; password?: string }) => Promise<void>;
    requestPasswordReset: (email: string) => Promise<string>;
    confirmPasswordReset: (email: string, code: string, newPassword: string) => Promise<string>;
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
                        Authorization: import.meta.env.VITE_MIGGO_API_KEY,
                    },
                    body: JSON.stringify(credentials),
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                // Mensagens específicas por código de status
                if (response.status === 403) {
                    throw new Error(data.message || "Sua conta está inativa. Entre em contato com a Miggo.");
                } else if (response.status === 401) {
                    throw new Error(data.message || "E-mail ou senha inválidos.");
                } else {
                    const msg = data.message || data.detail || (data.non_field_errors ? data.non_field_errors[0] : "Erro ao fazer login. Tente novamente.");
                    throw new Error(msg);
                }
            }

            if (data.user) {
                setUser(data.user);
                localStorage.setItem("user", JSON.stringify(data.user));
            } else {
                throw new Error("Resposta inválida do servidor.");
            }

        } catch (err: any) {
            const msg = err.message || "Ocorreu um erro durante o login.";
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
                    Authorization: import.meta.env.VITE_MIGGO_API_KEY,
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
                        Authorization: import.meta.env.VITE_MIGGO_API_KEY,
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

    const register = async (data: { name: string; email: string; phone: string; password?: string }) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(
                "/api/v1/account/register/",
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: import.meta.env.VITE_MIGGO_API_KEY,
                    },
                    body: JSON.stringify(data),
                }
            );

            const responseData = await response.json().catch(() => ({}));

            if (!response.ok) {
                // DRF retorna erros no formato: { "campo": ["mensagem"] } ou { "detail": "..." }
                const msg = parseDRFError(responseData);
                throw new Error(msg);
            }

            if (responseData.user) {
                setUser(responseData.user);
                localStorage.setItem("user", JSON.stringify(responseData.user));
            }
            return responseData;

        } catch (err: any) {
            const msg = err.message || "Ocorreu um erro durante o cadastro.";
            setError(msg);
            console.error("Registration error:", err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const requestPasswordReset = async (email: string): Promise<string> => {
        const response = await fetch("/api/v1/account/password-reset/request/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: import.meta.env.VITE_MIGGO_API_KEY,
            },
            body: JSON.stringify({ email }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Erro ao enviar o código.");
        return data.message || "Código enviado com sucesso.";
    };

    const confirmPasswordReset = async (email: string, code: string, newPassword: string): Promise<string> => {
        const response = await fetch("/api/v1/account/password-reset/confirm/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: import.meta.env.VITE_MIGGO_API_KEY,
            },
            body: JSON.stringify({ email, code, new_password: newPassword }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Erro ao redefinir a senha.");
        return data.message || "Senha redefinida com sucesso.";
    };

    return (
        <AuthContext.Provider value={{ user, loading, error, login, logout, updateProfile, register, requestPasswordReset, confirmPasswordReset }}>
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
