import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/authHook";
import { useClient } from "../../hooks/useClient";
import { useOnboarding, clearOnboardingCache } from "../../hooks/useOnboarding";
import PageMeta from "../../components/common/PageMeta";
import SocialConnections from "../../components/UserProfile/SocialConnections";
import Button from "../../components/ui/button/Button";

// ─── Ícones ─────────────────────────────────────────────────────────────────────
const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const MailIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
);

const PlanIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
    </svg>
);

const NetworkIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
        <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
    </svg>
);

const BrandIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
    </svg>
);

const UploadIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

const STEPS = [
    { id: 1, title: "Verificação", subtitle: "Confirme seu e-mail", icon: <MailIcon /> },
    { id: 2, title: "Plano", subtitle: "Escolha sua assinatura", icon: <PlanIcon /> },
    { id: 3, title: "Redes Sociais", subtitle: "Conecte suas contas", icon: <NetworkIcon /> },
    { id: 4, title: "Logomarca", subtitle: "Envie sua logo", icon: <BrandIcon /> },
];

// ─── Step 1: Verificação de e-mail ──────────────────────────────────────────────
function VerificationStep({ clientId, onSuccess }: { clientId: number; onSuccess: () => void }) {
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);
    const API_KEY = import.meta.env.VITE_MIGGO_API_KEY;

    const sendCode = async () => {
        setSending(true);
        setError("");
        try {
            await fetch(`/api/v1/client/generate-activation-code/${clientId}/`, {
                credentials: "include",
                headers: { Authorization: API_KEY },
            });
            setSent(true);
        } catch {
            setError("Erro ao enviar o código. Tente novamente.");
        } finally {
            setSending(false);
        }
    };

    const handleInput = (value: string, index: number) => {
        if (!/^\d?$/.test(value)) return;
        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);
        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`)?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`)?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        const newCode = [...code];
        for (let i = 0; i < pasted.length; i++) newCode[i] = pasted[i];
        setCode(newCode);
    };

    const verify = async () => {
        const fullCode = code.join("");
        if (fullCode.length < 6) return setError("Digite o código completo.");
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/v1/client/activate-account/${clientId}/`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json", Authorization: API_KEY },
                body: JSON.stringify({ activation_code: fullCode }),
            });
            if (res.ok) {
                onSuccess();
            } else {
                setError("Código inválido. Verifique e tente novamente.");
                setCode(["", "", "", "", "", ""]);
                document.getElementById("otp-0")?.focus();
            }
        } catch {
            setError("Erro ao verificar o código. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Vamos confirmar que você é a pessoa certa. Clique abaixo para receber um código de 6 dígitos no seu e-mail.
            </p>

            {!sent ? (
                <Button onClick={sendCode} disabled={sending} className="w-full flex items-center justify-center gap-2">
                    {sending ? (
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : <MailIcon />}
                    {sending ? "Enviando..." : "Enviar código por e-mail"}
                </Button>
            ) : (
                <div className="flex flex-col items-center gap-5 w-full">
                    <div className="flex items-center gap-2 text-sm text-success-500 font-medium">
                        <CheckIcon />
                        Código enviado! Verifique seu e-mail.
                    </div>

                    {/* OTP Input */}
                    <div className="flex gap-2 sm:gap-3" onPaste={handlePaste}>
                        {code.map((digit, i) => (
                            <input
                                key={i}
                                id={`otp-${i}`}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleInput(e.target.value, i)}
                                onKeyDown={(e) => handleKeyDown(e, i)}
                                className={`
                                    w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-lg border
                                    transition-all duration-200 outline-none
                                    bg-white dark:bg-gray-800
                                    text-gray-900 dark:text-white
                                    ${digit
                                        ? 'border-brand-500 ring-2 ring-brand-500/20 dark:border-brand-400'
                                        : 'border-gray-300 dark:border-gray-600 focus:border-brand-500 dark:focus:border-brand-400'
                                    }
                                `}
                            />
                        ))}
                    </div>

                    {error && <p className="text-sm text-error-500">{error}</p>}

                    <div className="flex flex-col gap-2 w-full">
                        <Button
                            onClick={verify}
                            disabled={loading || code.join("").length < 6}
                            className="w-full"
                        >
                            {loading ? "Verificando..." : "Verificar código"}
                        </Button>
                        <button
                            type="button"
                            onClick={sendCode}
                            className="text-sm text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors text-center py-1"
                        >
                            Reenviar código
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Step 2: Plano ───────────────────────────────────────────────────────────
function PlanStep({ clientId, onSuccess }: { clientId: number; onSuccess: () => void }) {
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [error, setError] = useState("");
    const [plans, setPlans] = useState<any[]>([]);
    const { user } = useAuth();
    const API_KEY = import.meta.env.VITE_MIGGO_API_KEY;

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const plansRes = await fetch('/api/v1/subscription/plan/list/', {
                    credentials: 'include',
                    headers: { 'Authorization': API_KEY }
                });
                const data = await plansRes.json();
                if (Array.isArray(data)) {
                    setPlans(data);
                }
            } catch (err: any) {
                setError("Erro ao carregar planos disponíveis.");
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, [API_KEY]);

    const startTrial = async (planId: number, priceId: number) => {
        setActionLoading(planId);
        setError("");
        try {
            const res = await fetch('/api/v1/subscription/start-trial/', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': API_KEY,
                },
                body: JSON.stringify({
                    plan_price_id: priceId,
                    user_id: user?.id,
                    trial_days: 7,
                }),
            });

            if (res.ok) {
                onSuccess();
            } else {
                const data = await res.json();
                if (data.error && data.error.includes("já possui uma assinatura") || data.error?.includes("trial")) {
                    onSuccess();
                } else {
                    setError(data.error || "Erro ao iniciar versão de testes.");
                    setActionLoading(null);
                }
            }
        } catch (err: any) {
            setError(err.message || "Erro de conexão ao iniciar trial.");
            setActionLoading(null);
        }
    };

    const forceSkip = async () => {
        setActionLoading(-1);
        await fetch(`/api/v1/client/onboarding-step/${clientId}/`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json", Authorization: API_KEY },
            body: JSON.stringify({ onboarding_step: 2 }),
        });
        onSuccess();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mb-4"></div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Carregando planos...
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                    Escolha seu plano
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Selecione o plano desejado para começar seu teste gratuito de 7 dias com a Miggo.
                </p>
            </div>

            {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/10 dark:border-red-900/30">
                    {error}
                </div>
            )}

            <div className="flex flex-col gap-4">
                {plans.map((plan) => {
                    const priceId = plan.price?.[0]?.id;
                    const isProcessing = actionLoading === plan.id;
                    return (
                        <div key={plan.id} className="flex flex-col p-5 sm:p-6 border border-gray-200 rounded-2xl dark:border-gray-800 bg-white dark:bg-gray-900 shadow-theme-xs transition-colors hover:border-brand-500/50">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                <h4 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h4>
                                <Button
                                    className="w-full sm:w-auto flex-shrink-0"
                                    disabled={!priceId || actionLoading !== null}
                                    onClick={() => priceId && startTrial(plan.id, priceId)}
                                >
                                    {isProcessing ? "Iniciando..." : "Começar Teste"}
                                </Button>
                            </div>

                            <ul className="space-y-3 flex-1 mt-2">
                                {plan.features?.map((feat: any) => (
                                    <li key={feat.id} className="flex items-start text-sm text-gray-600 dark:text-gray-300">
                                        <svg className="w-5 h-5 mr-3 text-brand-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span dangerouslySetInnerHTML={{ __html: feat.feature }} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>

            {plans.length === 0 && (
                <div className="flex flex-col items-center justify-center p-6 border border-gray-200 border-dashed rounded-xl dark:border-gray-800">
                    <p className="text-sm text-gray-500 mb-4">Nenhum plano disponível no momento.</p>
                    <Button variant="outline" onClick={forceSkip} disabled={actionLoading !== null}>Pular Etapa</Button>
                </div>
            )}
        </div>
    );
}

// ─── Step 3: Redes Sociais ───────────────────────────────────────────────────────
function SocialStep({ clientId, onSuccess }: { clientId: number; onSuccess: () => void }) {
    return (
        <div className="flex flex-col gap-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Conecte pelo menos uma rede social. Você pode adicionar mais redes depois, nas configurações.
            </p>
            <div className="max-h-80 overflow-y-auto rounded-xl">
                <SocialConnections clientId={clientId} isOnboarding={true} />
            </div>
            <Button onClick={onSuccess} className="w-full">
                Continuar
            </Button>
        </div>
    );
}

// ─── Step 4: BrandKit / Upload de Logo ──────────────────────────────────────────
function BrandkitStep({
    clientId,
    onSuccess,
    onSkip,
}: {
    clientId: number;
    onSuccess: () => void;
    onSkip: () => Promise<void>;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [preview, setPreview] = useState<string | null>(null);
    const [drag, setDrag] = useState(false);
    const API_KEY = import.meta.env.VITE_MIGGO_API_KEY;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (!selected) return;
        if (selected.size > 10 * 1024 * 1024) {
            setError("O arquivo deve ter no máximo 10MB.");
            return;
        }
        setFile(selected);
        setPreview(URL.createObjectURL(selected));
        setError("");
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDrag(false);
        const dropped = e.dataTransfer.files[0];
        if (!dropped) return;
        if (dropped.size > 10 * 1024 * 1024) {
            setError("O arquivo deve ter no máximo 10MB.");
            return;
        }
        setFile(dropped);
        setPreview(URL.createObjectURL(dropped));
        setError("");
    };

    const upload = async () => {
        if (!file) return setError("Selecione uma imagem para continuar.");
        setLoading(true);
        setError("");

        try {
            // 1. Buscar ou criar brandkit
            const listRes = await fetch(`/api/v1/brandkit/list/?client_id=${clientId}`, {
                credentials: "include",
                headers: { Authorization: API_KEY },
            });

            let brandkitId: number;
            if (listRes.ok) {
                const bkList = await listRes.json();
                if (bkList.length > 0) {
                    brandkitId = bkList[0].id;
                } else {
                    const createRes = await fetch(`/api/v1/brandkit/create/`, {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json", Authorization: API_KEY },
                        body: JSON.stringify({ client: clientId, name: "Identidade Visual", status: "active" }),
                    });
                    const bk = await createRes.json();
                    brandkitId = bk.id;
                }
            } else {
                throw new Error("Erro ao buscar brandkit");
            }

            // 2. Upload da logo
            const formData = new FormData();
            formData.append("brandkit", String(brandkitId));
            formData.append("file", file);
            formData.append("logo_type", "primary");

            const uploadRes = await fetch(`/api/v1/brandkit/logo/upload/`, {
                method: "POST",
                credentials: "include",
                headers: { Authorization: API_KEY },
                body: formData,
            });

            if (!uploadRes.ok) throw new Error("Erro ao fazer upload da logo");
            onSuccess();
        } catch (err: any) {
            setError(err.message || "Erro ao fazer upload. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">
                Envie a logomarca principal da sua marca. Formatos aceitos: PNG, SVG, JPG.
            </p>

            {/* Dropzone */}
            <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onClick={() => document.getElementById("logo-input")?.click()}
                className={`
                    relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3
                    cursor-pointer transition-all duration-200 min-h-[160px]
                    ${drag
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10'
                        : preview
                            ? 'border-brand-400 bg-brand-50/50 dark:bg-brand-900/5'
                            : 'border-gray-300 dark:border-gray-600 hover:border-brand-400 dark:hover:border-brand-500 bg-gray-50 dark:bg-gray-800/50'
                    }
                `}
            >
                {preview ? (
                    <div className="flex flex-col items-center gap-2">
                        <img src={preview} alt="Preview da logo" className="max-h-24 max-w-full object-contain" />
                        <p className="text-xs text-gray-400 truncate max-w-[200px]">{file?.name}</p>
                    </div>
                ) : (
                    <>
                        <div className="text-gray-400 dark:text-gray-500">
                            <UploadIcon />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Clique ou arraste sua logo aqui
                            </p>
                            <p className="text-xs text-gray-400 mt-1">PNG, SVG, JPG • Máx. 10MB</p>
                        </div>
                    </>
                )}
                <input
                    id="logo-input"
                    type="file"
                    accept="image/*,video/*,application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>

            {preview && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setPreview(null);
                    }}
                    className="text-xs text-gray-400 hover:text-error-500 transition-colors text-center -mt-2"
                >
                    Remover e escolher outra
                </button>
            )}

            {error && <p className="text-sm text-error-500">{error}</p>}

            <div className="flex flex-col gap-2">
                <Button
                    onClick={upload}
                    disabled={loading || !file}
                    className="w-full"
                >
                    {loading ? "Enviando..." : "Enviar logomarca"}
                </Button>
                <Button
                    variant="outline"
                    onClick={onSkip}
                    className="w-full"
                >
                    Não tenho logo agora
                </Button>
            </div>
        </div>
    );
}

// ─── Stepper visual ──────────────────────────────────────────────────────────────
function Stepper({ activeStep, completedStep }: { activeStep: number; completedStep: number }) {
    return (
        <div className="flex items-center justify-center gap-0 mb-8">
            {STEPS.map((step, idx) => {
                const isDone = completedStep >= step.id;
                const isActive = activeStep === step.id;
                return (
                    <div key={step.id} className="flex items-center">
                        <div className="flex flex-col items-center gap-1">
                            <div
                                className={`
                                    w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold
                                    transition-all duration-300
                                    ${isDone
                                        ? 'bg-brand-500 text-white'
                                        : isActive
                                            ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 ring-2 ring-brand-500/30'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                                    }
                                `}
                            >
                                {isDone ? <CheckIcon /> : step.id}
                            </div>
                            <span
                                className={`text-[10px] font-medium hidden sm:block transition-colors ${isActive
                                    ? 'text-brand-600 dark:text-brand-400'
                                    : isDone
                                        ? 'text-success-500'
                                        : 'text-gray-400'
                                    }`}
                            >
                                {step.title}
                            </span>
                        </div>
                        {idx < STEPS.length - 1 && (
                            <div
                                className={`w-12 sm:w-16 h-0.5 mb-4 mx-1 rounded-full transition-all duration-500 ${completedStep > step.id ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Componente Principal ────────────────────────────────────────────────────────
export default function OnboardingFlow() {
    const { user, logout } = useAuth();
    const { clientId, loading: clientLoading } = useClient();
    const { status, loading: onboardingLoading, refetch } = useOnboarding(
        user?.role === "client" ? clientId : null
    );
    const navigate = useNavigate();

    const [activeStep, setActiveStep] = useState(1);
    // Flag para evitar que o useEffect de status reactive o redirect após completar
    const [completing, setCompleting] = useState(false);

    // Sincronizar step ativo com dados do backend (só na carga inicial)
    useEffect(() => {
        if (status && !completing) {
            const nextIncomplete = (status.onboarding_step || 0) + 1;
            setActiveStep(Math.min(nextIncomplete, 4));
        }
    }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

    // Redirecionar para home quando onboarding estiver realmente completo
    // Só age se completedStep === 4 E não estamos no meio de completar
    useEffect(() => {
        if (status?.is_onboarding_complete && !completing) {
            clearOnboardingCache();
            navigate("/", { replace: true });
        }
    }, [status?.is_onboarding_complete]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleStepSuccess = useCallback(async () => {
        const nextStep = activeStep + 1;

        if (nextStep > 4) {
            // Onboarding completo via upload: limpar cache e navegar
            setCompleting(true);
            clearOnboardingCache();
            await refetch();
            navigate("/", { replace: true });
        } else {
            // Avançar step + persistir no backend para garantir que não volte
            if (clientId) {
                fetch(`/api/v1/client/onboarding-step/${clientId}/`, {
                    method: "PATCH",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: import.meta.env.VITE_MIGGO_API_KEY
                    },
                    body: JSON.stringify({ onboarding_step: activeStep }),
                }).catch(err => console.error("Failed to persist onboarding step", err));
            }

            setActiveStep(nextStep);
            refetch();
        }
    }, [activeStep, refetch, navigate]);

    // Quando o usuário pula o brandkit: força step=4 no backend
    const handleBrandkitSkip = useCallback(async () => {
        if (!clientId) return;
        setCompleting(true);
        try {
            await fetch(`/api/v1/client/onboarding-step/${clientId}/`, {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: import.meta.env.VITE_MIGGO_API_KEY,
                },
                body: JSON.stringify({ onboarding_step: 4 }),
            });
        } catch (e) {
            console.error("Failed to force onboarding step", e);
        } finally {
            clearOnboardingCache();
            navigate("/", { replace: true });
        }
    }, [clientId, navigate]);

    if (clientLoading || onboardingLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
                    <p className="text-sm text-gray-400">Carregando...</p>
                </div>
            </div>
        );
    }

    const completedStep = status?.onboarding_step || 0;

    return (
        <>
            <PageMeta title="Configuração | Miggo" description="Configure sua conta Miggo" />

            <div className="w-full min-h-screen flex flex-col lg:flex-row bg-white dark:bg-gray-900">

                {/* ── Painel esquerdo: conteúdo principal ── */}
                <div className="flex flex-col w-full lg:w-1/2 min-h-screen lg:h-screen lg:overflow-y-auto">

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pt-6">
                        <a href="/" className="inline-block">
                            <img
                                className="dark:hidden h-8 w-auto"
                                src="/images/logo/logo_dark_expanded.svg"
                                alt="Miggo"
                            />
                            <img
                                className="hidden dark:block h-8 w-auto"
                                src="/images/logo/logo_light_expanded.svg"
                                alt="Miggo"
                            />
                        </a>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                                {user?.name}
                            </span>
                            <button
                                type="button"
                                onClick={logout}
                                className="text-sm text-gray-400 hover:text-error-500 dark:hover:text-error-400 transition-colors"
                            >
                                Sair
                            </button>
                        </div>
                    </div>

                    {/* Conteúdo central */}
                    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
                        <div className="w-full max-w-[420px]">

                            {/* Stepper */}
                            <Stepper activeStep={activeStep} completedStep={completedStep} />

                            {/* Título do step atual */}
                            <div className="mb-6">
                                <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
                                    {STEPS[activeStep - 1]?.title}
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Passo {activeStep} de {STEPS.length} — {STEPS[activeStep - 1]?.subtitle}
                                </p>
                            </div>

                            {/* Conteúdo do step */}
                            <div>
                                {activeStep === 1 && clientId && (
                                    <VerificationStep
                                        clientId={clientId}
                                        onSuccess={handleStepSuccess}
                                    />
                                )}
                                {activeStep === 2 && clientId && (
                                    <PlanStep
                                        clientId={clientId}
                                        onSuccess={handleStepSuccess}
                                    />
                                )}
                                {activeStep === 3 && clientId && (
                                    <SocialStep clientId={clientId} onSuccess={handleStepSuccess} />
                                )}
                                {activeStep === 4 && clientId && (
                                    <BrandkitStep
                                        clientId={clientId}
                                        onSuccess={handleStepSuccess}
                                        onSkip={handleBrandkitSkip}
                                    />
                                )}
                            </div>

                            <p className="mt-8 text-center text-xs text-gray-400">
                                Precisa de ajuda?{" "}
                                <a
                                    href="mailto:suporte@miggo.com.br"
                                    className="text-brand-500 hover:text-brand-600 dark:text-brand-400 hover:underline"
                                >
                                    Fale com o suporte
                                </a>
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Painel direito: banner (só desktop) ── */}
                <div className="hidden lg:block lg:w-1/2 h-screen sticky top-0">
                    <img
                        src="/images/grid-image/banner.webp"
                        alt="Miggo Banner"
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
        </>
    );
}
