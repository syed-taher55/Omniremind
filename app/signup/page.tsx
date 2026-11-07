import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthScreen, SetupHelp } from "@/components/auth-screen";
import { SignUpForm } from "@/components/auth-forms";
import { getWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ missing?: string }>;
}) {
  const query = await searchParams;
  const workspace = await getWorkspace();
  if (workspace.configured && workspace.user && workspace.tenant) redirect("/app");
  return (
    <AuthScreen
      title="Create a workspace"
      lede="One business per signup. Hospitals, schools, and shops each get their own queue."
    >
      {query.missing === "workspace" ? (
        <p className="mb-4 text-sm text-clay">
          This account has no workspace. Run supabase/001_init.sql so the signup trigger can create one, then register again.
        </p>
      ) : null}
      {workspace.configured ? <SignUpForm /> : <SetupHelp />}
      <p className="mt-6 text-sm text-muted">
        Already registered? <Link href="/login" className="text-ink underline">Sign in</Link>
      </p>
    </AuthScreen>
  );
}
