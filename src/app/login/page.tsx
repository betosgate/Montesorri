import Link from "next/link";
import AuthForm from "@/components/auth/auth-form";

export const metadata = {
  title: "Sign In — Montessori Homeschool",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-stone-800">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            Sign in to continue your Montessori Homeschool journey.
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
          <AuthForm mode="login" />
        </div>

        <p className="mt-6 text-center text-sm text-stone-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-green-700 hover:text-green-800"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
