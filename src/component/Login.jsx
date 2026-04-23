import sampleLogin from "../assets/samplelogin.png";

const Login = () => {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 pt-24">
      
      {/* CARD */}
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-lg grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        
        {/* LEFT SIDE (FORM) */}
        <div className="flex flex-col justify-center px-10 py-12">
          <h2 className="text-3xl font-semibold text-center mb-2">
            Welcome
          </h2>

          <p className="text-center text-slate-500 mb-8">
            login your account
          </p>

          <div className="space-y-5">
            {/* Email */}
            <div>
              <label className="text-sm text-slate-600">Email</label>
              <input
                type="email"
                className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm text-slate-600">Password</label>
              <input
                type="password"
                className="w-full h-11 px-4 rounded-xl border border-slate-300 bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* BUTTON */}
            <button className="w-full h-11 bg-[#0056b3] text-white rounded-xl font-semibold hover:bg-[#003a78] transition">
              Login
            </button>
          </div>

          {/* REGISTER TEXT */}
          <p className="text-xs text-slate-500 mt-6 text-center">
            If you are new applicant, register your account{" "}
            <span className="text-blue-600 font-medium cursor-pointer hover:underline">
              Here
            </span>
          </p>
        </div>

        {/* RIGHT SIDE (IMAGE PANEL) */}
        <div className="bg-[#0056b3] flex items-center justify-center p-8">
          <img
            src={sampleLogin}
            alt="Login Illustration"
            className="max-h-[400px] object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;