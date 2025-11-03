function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E2A5A] to-[#1A2847] animate-gradientShift">
      <div className="w-full max-w-[520px] px-8 animate-fadeInUp">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
            Welcome to My Task Manager
          </h1>
          <p className="text-xl text-white/85">
            Organize your day with simplicity and style.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/[0.18] rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-12 animate-float">
          <div className="flex flex-col space-y-5">
            <button className="bg-white text-[#1E2A5A] font-bold py-3.5 px-10 rounded-xl transition-all duration-300 hover:bg-[#F8FAFC] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105">
              Login
            </button>

            <button className="bg-white text-[#1E2A5A] font-bold py-3.5 px-10 rounded-xl transition-all duration-300 hover:bg-[#F8FAFC] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105">
              Signup
            </button>

            <button className="bg-white text-[#1E2A5A] font-bold py-3.5 px-10 rounded-xl transition-all duration-300 hover:bg-[#F8FAFC] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105">
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
