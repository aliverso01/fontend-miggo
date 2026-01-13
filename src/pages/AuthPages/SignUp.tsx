import { Navigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";
import { useAuth } from "../../hooks/authHook";

export default function SignUp() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <PageMeta
        title="Miggo - Cadastrar"
        description="Miggo - Sua plataforma de posts por assinatura"
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
