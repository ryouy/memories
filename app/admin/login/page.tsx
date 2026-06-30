import { LoginForm } from "@/components/admin/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-5">
      <section className="w-full max-w-sm rounded-lg border border-stone-200 bg-white p-6">
        <h1 className="font-serif text-3xl">Memories Admin</h1>
        <p className="mt-2 text-sm text-stone-600">4桁のパスワードナンバーを入力してください。</p>
        <LoginForm />
      </section>
    </main>
  );
}
