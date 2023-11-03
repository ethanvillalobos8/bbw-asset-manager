'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from "firebase/auth";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from '/utils/firebase';
import { FaGithub } from 'react-icons/fa';

const LoginPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  // Re-renders the component after the first render
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
      // This forces a rerender, so the page is rendered
      // the second time but not the first
      setHydrated(true);
  }, []);
  if (!hydrated) {
      // Returns null on first render, so the client and server match
      return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/portal');
    } catch (err) {
      setError(err.message);
    }
  };

  function handleForgotPassword() {
    const email = prompt("Please enter your email:");

    if (email) {
      sendPasswordResetEmail(auth, email)
        .then(() => {
          alert("Password reset email sent! Check your inbox.");
        })
        .catch((error) => {
          console.error("Error sending password reset email:", error);
          alert(error.message);
        });
    }
  }

  return (
    <div style={{ backgroundColor: '#f6fbfd', minHeight: '100vh' }} className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center">
      <img src='/swiftscan_main.png' className='w-1/4 h-1/4 pb-10'></img>
      <div className="flex justify-center bg-white p-8 rounded-lg shadow-xl w-96">
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form className="flex flex-col w-full" onSubmit={handleSubmit}>
          <div className="mb-5">
            <input
              type="email"
              placeholder='Email'
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded-md text-zinc-500 text-m"
              required
            />
          </div>
          <div className="mb-7">
            <input
              type="password"
              placeholder='Password'
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded-md text-zinc-500 text-m"
              required
            />
          </div>
          <button type="submit" className="h-10 w-1/2 self-center bg-blue-400 text-white p-2 rounded-full hover:bg-blue-500 text-sm font-semibold font-sans">
            LOG IN
          </button>
        </form>
      </div>
      <button className="pt-10 text-zinc-400 hover:text-zinc-600" onClick={handleForgotPassword}>Forgot Password?</button>
      <a
        href="https://github.com/ethanvillalobos8"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-4 right-4 flex items-center text-zinc-400 hover:text-zinc-600 text-sm"
      >
        <FaGithub className="mr-2 text-xl" />
        @ethanvillalobos8
      </a>
    </div>
  );
}

export default LoginPage;
