import { useState } from "react";
import { Link, useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import { useAuth } from "../../hooks/authHook";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Button from "../../components/ui/button/Button";

type Step = "email" | "code" | "success";

function getPasswordStrength(password: string): { label: string; color: string; width: string; score: number } {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { label: "Muito fraca", color: "bg-error-500", width: "w-1/5", score };
    if (score === 2) return { label: "Fraca", color: "bg-orange-400", width: "w-2/5", score };
    if (score === 3) return { label: "Razoável", color: "bg-yellow-400", width: "w-3/5", score };
    if (score === 4) return { label: "Forte", color: "bg-green-400", width: "w-4/5", score };
    return { label: "Muito forte", color: "bg-green-600", width: "w-full", score };
}

function ResetPasswordForm() {
    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { requestPasswordReset, confirmPasswordReset } = useAuth();
    const navigate = useNavigate();

    const passwordStrength = getPasswordStrength(newPassword);

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!email.trim()) {
            setError("Por favor, informe seu e-mail.");
            return;
        }
        setLoading(true);
        try {
            await requestPasswordReset(email.trim());
            setStep("code");
        } catch (err: any) {
            setError(err.message || "Erro ao enviar o código. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!code.trim()) {
            setError("Informe o código recebido por e-mail.");
            return;
        }
        if (!newPassword) {
            setError("Informe a nova senha.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("As senhas não coincidem.");
            return;
        }
        if (newPassword.length < 8) {
            setError("A senha deve ter pelo menos 8 caracteres.");
            return;
        }
        if (!/[A-Z]/.test(newPassword)) {
            setError("A senha deve conter pelo menos uma letra maiúscula.");
            return;
        }
        if (!/[0-9]/.test(newPassword)) {
            setError("A senha deve conter pelo menos um número.");
            return;
        }

        setLoading(true);
        try {
            await confirmPasswordReset(email.trim(), code.trim(), newPassword);
            setStep("success");
        } catch (err: any) {
            setError(err.message || "Código inválido ou expirado. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="mb-5 sm:mb-8">
                <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                    {step === "success" ? "Senha redefinida!" : "Redefinir Senha"}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {step === "email" && "Informe seu e-mail para receber o código de redefinição."}
                    {step === "code" && `Insira o código enviado para ${email} e defina sua nova senha.`}
                    {step === "success" && "Sua senha foi alterada com sucesso."}
                </p>
            </div>

            {/* Success state */}
            {step === "success" && (
                <div className="flex flex-col items-center gap-5 p-6 text-center bg-green-50 border border-green-200 rounded-xl dark:bg-green-950/30 dark:border-green-800">
                    <span className="text-5xl">🎉</span>
                    <p className="text-green-800 dark:text-green-300 font-medium">
                        Sua senha foi redefinida com sucesso! Você já pode entrar com a nova senha.
                    </p>
                    <Button onClick={() => navigate("/signin")} className="w-full">
                        Ir para o Login
                    </Button>
                </div>
            )}

            {/* Step 1: Enter email */}
            {step === "email" && (
                <form onSubmit={handleRequestReset}>
                    <div className="space-y-6">
                        <div>
                            <Label>E-mail <span className="text-error-500">*</span></Label>
                            <Input
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                            />
                        </div>

                        {error && (
                            <div className="flex items-start gap-3 p-4 rounded-lg text-sm bg-error-50 border border-error-200 text-error-700 dark:bg-error-950/30 dark:border-error-800 dark:text-error-400">
                                <span className="flex-shrink-0">⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <Button className="w-full" disabled={loading} type="submit">
                            {loading ? "Enviando..." : "Enviar Código"}
                        </Button>
                    </div>
                </form>
            )}

            {/* Step 2: Enter code + new password */}
            {step === "code" && (
                <form onSubmit={handleConfirmReset}>
                    <div className="space-y-5">
                        {/* Resend code hint */}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Não recebeu?</span>
                            <button
                                type="button"
                                onClick={async () => {
                                    setError(null);
                                    setLoading(true);
                                    try { await requestPasswordReset(email); } catch { }
                                    setLoading(false);
                                }}
                                className="text-brand-500 hover:text-brand-600 font-medium"
                            >
                                Reenviar código
                            </button>
                        </div>

                        <div>
                            <Label>Código de verificação <span className="text-error-500">*</span></Label>
                            <Input
                                type="text"
                                placeholder="Ex: 123456"
                                value={code}
                                onChange={(e) => { setCode(e.target.value); setError(null); }}
                                maxLength={10}
                            />
                        </div>

                        <div>
                            <Label>Nova Senha <span className="text-error-500">*</span></Label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Mín. 8 caracteres, 1 maiúscula e 1 número"
                                    value={newPassword}
                                    onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
                                />
                                <span
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                                >
                                    {showPassword ? (
                                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                                    ) : (
                                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                                    )}
                                </span>
                            </div>
                            {newPassword && (
                                <div className="mt-2">
                                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                                        <div className={`h-full transition-all duration-300 rounded-full ${passwordStrength.color} ${passwordStrength.width}`} />
                                    </div>
                                    <p className={`text-xs mt-1 ${passwordStrength.score <= 2 ? "text-error-500" :
                                            passwordStrength.score === 3 ? "text-yellow-600" : "text-green-600"
                                        }`}>
                                        Força: {passwordStrength.label}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div>
                            <Label>Confirmar Nova Senha <span className="text-error-500">*</span></Label>
                            <div className="relative">
                                <Input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Repita a nova senha"
                                    value={confirmPassword}
                                    onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                                />
                                <span
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                                >
                                    {showConfirmPassword ? (
                                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                                    ) : (
                                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                                    )}
                                </span>
                            </div>
                            {confirmPassword && newPassword !== confirmPassword && (
                                <p className="text-xs text-error-500 mt-1">As senhas não coincidem.</p>
                            )}
                            {confirmPassword && newPassword === confirmPassword && newPassword && (
                                <p className="text-xs text-green-600 mt-1">✓ Senhas coincidem.</p>
                            )}
                        </div>

                        {error && (
                            <div className="flex items-start gap-3 p-4 rounded-lg text-sm bg-error-50 border border-error-200 text-error-700 dark:bg-error-950/30 dark:border-error-800 dark:text-error-400">
                                <span className="flex-shrink-0">⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <Button className="w-full" disabled={loading} type="submit">
                            {loading ? "Redefinindo..." : "Redefinir Senha"}
                        </Button>

                        <button
                            type="button"
                            onClick={() => { setStep("email"); setError(null); }}
                            className="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            ← Usar outro e-mail
                        </button>
                    </div>
                </form>
            )}

            <div className="mt-5">
                <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400">
                    Lembrou a senha?{" "}
                    <Link to="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                        Entrar
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default function ResetPassword() {
    return (
        <>
            <PageMeta
                title="Miggo - Redefinir Senha"
                description="Redefina sua senha da plataforma Miggo"
            />
            <AuthLayout>
                <ResetPasswordForm />
            </AuthLayout>
        </>
    );
}
