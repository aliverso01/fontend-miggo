import { Navigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";
import { useAuth } from "../../hooks/authHook";

export default function SignIn() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <PageMeta
        title="Miggo - Entrar"
        description="Miggo - Sua plataforma de posts por assinatura"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
