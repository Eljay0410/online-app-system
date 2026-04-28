import imageSample from "../assets/imagesample.svg";
import { Link } from "react-router-dom";

const Login = () => {
  return (
    <div className="min-h-screen bg-slate-100 flex pt-10">

      {/* LEFT SIDE (FORM - FIXED WIDTH) */}
      <div className="w-full max-w-md bg-white flex flex-col justify-center px-10 py-12 shadow-md">
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
          <Link
            to="/apply"
            className="text-blue-600 font-medium cursor-pointer hover:underline"
          >
            Here
          </Link>
        </p>
      </div>

      {/* RIGHT SIDE (IMAGE - HIDDEN ON MOBILE) */}
        <div className="hidden md:flex flex-1 items-center justify-center bg-blue-600">
          <img
            src={imageSample}
            alt="Login Illustration"
            className="w-full h-full object-cover"
          />
        </div>

    </div>
  );
};

export default Login;