import { redirect } from "next/navigation";
import { AuthScreen, SetupHelp } from "@/components/auth-screen";
import { SignInForm } from "@/components/auth-forms";
import { getWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const workspace = await getWorkspace();
  if (workspace.configured && workspace.user) {
    redirect(workspace.tenant ? "/app" : "/signup?missing=workspace");
  }
  return (
    <AuthScreen title="Sign in" lede="Open the workspace tied to your email.">
      {workspace.configured ? <SignInForm /> : <SetupHelp />}
    </AuthScreen>
  );
}
