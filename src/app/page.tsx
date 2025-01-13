"use client";
import { useSession } from "@supabase/auth-helpers-react";

export default function Home() {
  const session = useSession();
  // console.log(session?.user?.user_metadata?.email)

  return (
    <div><h2 className="text-2xl font-bold text-black">USER EMAIL: {session?.user?.email}</h2></div>
  );
}
