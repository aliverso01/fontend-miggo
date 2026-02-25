import { useState } from "react";
import { Link } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import { useAuth } from "../../hooks/authHook";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const { register, loading } = useAuth();

  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    password: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isChecked) {
      alert("Você deve aceitar os termos e condições.");
      return;
    }
    const name = `${formData.fname} ${formData.lname}`.trim();
    if (!name || !formData.email || !formData.password) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }
    await register({
      name,
      email: formData.email,
      password: formData.password
    });
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
              Senha<span className="text-error-500">*</span>
            </Label>
            <div className="relative">
              <Input
                placeholder="Digite sua senha"
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
    </div>
  );
}
