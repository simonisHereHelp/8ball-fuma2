// app/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  // ✅ Always start OAuth flow
  if (!session) {
    redirect("/api/auth/signin?callbackUrl=/docs");
  }

  // ✅ Only allow your Gmail account to access /docs
  if (session?.user?.email === "99.cent.bagel@gmail.com") {
    redirect("/docs");
  }

  // ✅ For any other signed-in account, show sign-in prompt again
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
      <Link
        href="/api/auth/signin?callbackUrl=/docs"
        className="rounded-md border border-zinc-400 px-4 py-2 text-base hover:bg-zinc-200 dark:border-zinc-600 dark:hover:bg-zinc-800"
      >
        Sign in
      </Link>
    </div>
  );
}
