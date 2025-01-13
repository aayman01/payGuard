"use client";
import Link from "next/link";

export default function Home() {
  

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-5xl font-bold text-black">Welcome to the PayGuard</h2>
      <Link className="mt-7" href="/dashboard">
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">Dashboard</button>
      </Link>
    </div>
  );
}
