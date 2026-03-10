import { useState } from "react";
import { Link } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import { useAuth } from "../../hooks/authHook";

// Password strength checker
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

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const { register, loading } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError(null);
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // Frontend validations (espelha as regras do backend)
  const validateEmail = (email: string): string | null => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Formato de e-mail inválido.";
    return null;
  };

  const validatePhone = (phone: string): string | null => {
    const digits = phone.replace(/[\s\-\(\)]/g, "");
    if (!/^\+?\d{8,15}$/.test(digits)) return "Telefone inválido. Use apenas dígitos (ex: 11999999999).";
    return null;
  };

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
    if (!/[A-Z]/.test(pwd)) return "A senha deve conter pelo menos uma letra maiúscula.";
    if (!/[0-9]/.test(pwd)) return "A senha deve conter pelo menos um número.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!isChecked) {
      setFormError("Você deve aceitar os termos e condições.");
      return;
    }

    const name = `${formData.fname} ${formData.lname}`.trim();
    if (!name || !formData.email || !formData.phone || !formData.password) {
      setFormError("Preencha todos os campos obrigatórios.");
      return;
    }

    const emailError = validateEmail(formData.email);
    if (emailError) { setFormError(emailError); return; }

    const phoneError = validatePhone(formData.phone);
    if (phoneError) { setFormError(phoneError); return; }

    if (formData.password !== formData.confirmPassword) {
      setFormError("As senhas não coincidem.");
      return;
    }

    const pwdError = validatePassword(formData.password);
    if (pwdError) {
      setFormError(pwdError);
      return;
    }

    try {
      await register({
        name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
      setSuccessMsg("Cadastro realizado com sucesso! Aguarde a ativação da sua conta pela equipe Miggo.");
    } catch (err: any) {
      setFormError(err.message || "Erro ao criar a conta. Tente novamente.");
    }
  };

  return (
    <div>
      <div className="mb-4">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Voltar ao painel
        </Link>
      </div>

      <div className="mb-5 sm:mb-8">
        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
          Cadastrar
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Preencha os dados abaixo para se cadastrar!
        </p>
      </div>

      {successMsg ? (
        <div className="flex flex-col items-center gap-4 p-6 text-center bg-green-50 border border-green-200 rounded-xl dark:bg-green-950/30 dark:border-green-800">
          <span className="text-4xl">✅</span>
          <p className="text-green-800 dark:text-green-300 font-medium">{successMsg}</p>
          <Link to="/signin" className="text-brand-500 hover:text-brand-600 text-sm font-medium">
            Ir para o login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <Label>
                  Nome<span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  id="fname"
                  name="fname"
                  placeholder="Digite seu nome"
                  value={formData.fname}
                  onChange={handleInputChange}
                />
              </div>
              <div className="sm:col-span-1">
                <Label>
                  Sobrenome<span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  id="lname"
                  name="lname"
                  placeholder="Digite seu sobrenome"
                  value={formData.lname}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <Label>
                E-mail<span className="text-error-500">*</span>
              </Label>
              <Input
                type="email"
                id="email"
                name="email"
                placeholder="Digite seu e-mail"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>
                Telefone (WhatsApp)<span className="text-error-500">*</span>
              </Label>
              <Input
                type="text"
                id="phone"
                name="phone"
                placeholder="Ex: 11999999999"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label>
                Senha<span className="text-error-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  placeholder="Mín. 8 caracteres, 1 maiúscula e 1 número"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
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

              {/* Password strength bar */}
              {formData.password && (
                <div className="mt-2">
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                    <div className={`h-full transition-all duration-300 rounded-full ${passwordStrength.color} ${passwordStrength.width}`} />
                  </div>
                  <p className={`text-xs mt-1 ${passwordStrength.score <= 2 ? "text-error-500" :
                    passwordStrength.score === 3 ? "text-yellow-600" : "text-green-600"
                    }`}>
                    Força da senha: {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label>
                Confirmar Senha<span className="text-error-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  placeholder="Repita sua senha"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
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
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-error-500 mt-1">As senhas não coincidem.</p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password && (
                <p className="text-xs text-green-600 mt-1">✓ Senhas coincidem.</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                className="w-5 h-5"
                checked={isChecked}
                onChange={setIsChecked}
              />
              <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                Ao criar uma conta você concorda com os{" "}
                <Link to="/terms" target="_blank" className="text-brand-500 hover:text-brand-600 font-medium">
                  Termos e Condições
                </Link>
                {" "}e nossa{" "}
                <Link to="/privacy" target="_blank" className="text-brand-500 hover:text-brand-600 font-medium">
                  Política de Privacidade
                </Link>
              </p>
            </div>

            {/* Error display — suporta múltiplas linhas vindas do backend */}
            {formError && (
              <div className="flex items-start gap-3 p-4 rounded-lg text-sm bg-error-50 border border-error-200 text-error-700 dark:bg-error-950/30 dark:border-error-800 dark:text-error-400">
                <span className="text-base flex-shrink-0 mt-0.5">⚠️</span>
                <ul className="space-y-1 list-none">
                  {formError.split("\n").map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <button
                className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={loading}
              >
                {loading ? "Cadastrando..." : "Cadastrar"}
              </button>
            </div>
          </div>
        </form>
      )}

      {!successMsg && (
        <div className="mt-5">
          <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
            Já tem uma conta?{" "}
            <Link
              to="/signin"
              className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
            >
              Entrar
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
