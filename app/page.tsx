"use client";
import { useRouter } from 'next/navigation';
import { signIn, signOut, useSession } from "next-auth/react"
import { useState } from 'react';

export default function LandingPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [userEmail, setUserEmail] = useState<string>("");

  const handleClick = () => {
    router.push('/tree');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-100 px-4">
        <h1 className="text-5xl font-bold mb-8 text-gray-800 tracking-tight">
          GPTree
        </h1>

    {session ? (
        <div className="flex flex-col gap-4">
        <button 
            onClick={handleClick}
            className="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
          >
          New Tree
        </button>
        <button
          onClick={() => signOut()}
          className="px-6 py-3 bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition"
        >
          Sign Out
        </button>
      </div >
    ) : (<div className= "flex flex-col gap-4 w-full max-w-sm">
      <button
        onClick={() => signIn("google")}
        className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
      >
        Continue with Google
      </button>

      <div className="flex gap-4">
        

      <input 
        value={userEmail} 
        onChange={(e) => setUserEmail(e.target.value)}
        placeholder="Enter your email"
        className = "flex-1 border-grey-300 rounded-lg px-4 py-2 focus: ring-1 focus:ring-gray-300 focus:ring-2 focus:ring-green-500"
        />
      <button
        onClick={() => signIn("email", { email: userEmail})}
        className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
      >
        Continue
      </button>
    </div>
  </div>
    )}
  </div>
  );
}