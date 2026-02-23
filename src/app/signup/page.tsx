import Link from "next/link";
import AuthForm from "@/components/auth/auth-form";

export const metadata = {
  title: "Create Account — Montessori Homeschool",
};

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-stone-800">
            Create Your Account
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            Join our Montessori Homeschool community and start planning your
            child&apos;s learning path.
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
          <AuthForm mode="signup" />
        </div>

        <p className="mt-6 text-center text-sm text-stone-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-green-700 hover:text-green-800"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
