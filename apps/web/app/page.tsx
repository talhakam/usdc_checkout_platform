import React from "react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100">
      <nav className="w-full py-4 px-8 flex justify-between items-center bg-white shadow">
        <span className="text-xl font-bold text-blue-700">USDC Checkout Platform</span>
        <div className="space-x-4">
          <a href="#" className="text-gray-600 hover:text-blue-700 font-medium">Docs</a>
          <a href="#" className="text-gray-600 hover:text-blue-700 font-medium">GitHub</a>
        </div>
      </nav>
      <section className="flex flex-col items-center justify-center flex-1 w-full px-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-xl w-full text-center mt-16">
          <h1 className="text-4xl font-extrabold text-blue-700 mb-4">
            USDC Checkout Platform
          </h1>
          <p className="text-lg text-gray-700 mb-6">
            Kickstart your crypto checkout experience with Next.js, React, and Tailwind CSS.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="#"
              className="px-6 py-2 bg-blue-700 text-white rounded-lg font-semibold shadow hover:bg-blue-800 transition"
            >
              Get Started
            </a>
            <a
              href="#"
              className="px-6 py-2 bg-gray-100 text-blue-700 rounded-lg font-semibold shadow hover:bg-gray-200 transition"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>
      <footer className="w-full py-6 text-center text-gray-500 text-sm mt-12">
        © {new Date().getFullYear()} USDC Checkout Platform. Powered by Next.js & Tailwind CSS.
      </footer>
    </main>
  );
}