import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, LogIn } from "lucide-react";
import keralaLogo from "../KERALALOGO.webp" // adjust path as needed

function GovtLogin() {
  const [govtId, setGovtId] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    setErrorMsg("");

    try {
      const res = await axios.post(
        "http://localhost:3030/api/govt/login",
        { govtId, password },
        { withCredentials: true }
      );

      navigate("/govt/dashboard");
    } catch (err) {
      setErrorMsg("Invalid Govt ID or Password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 p-6">
      <div className="w-full max-w-md bg-white shadow-xl rounded-xl p-8">
        <div className="flex flex-col items-center mb-6">
           <img
          src={keralaLogo}
          alt="Kerala Emblem"
          className="w-14 h-14 object-contain brightness-75 contrast-125"
        />
          <h2 className="text-2xl font-bold text-gray-900">
            Govt Officer Login
          </h2>
          <p className="text-gray-600 text-sm">Kerala Migrant Health System</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="text-gray-700 font-medium text-sm">
              Government ID
            </label>
            <input
              type="text"
              value={govtId}
              onChange={(e) => setGovtId(e.target.value)}
              placeholder="Enter Govt ID"
              className="w-full p-3 border border-gray-300 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6">
            <label className="text-gray-700 font-medium text-sm">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Password"
              className="w-full p-3 border border-gray-300 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {errorMsg && <p className="text-red-500 text-sm mb-3">{errorMsg}</p>}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
          >
            <LogIn size={18} />
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default GovtLogin;
