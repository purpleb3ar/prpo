import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/auth";
import { toast } from "react-toastify";
import { ensureErrorMessage } from "../../shared/helpers/ensureErrorMessage";

// const GOOGLE_LOGIN_URL = "http://localhost:9000/auth/google";
// const REGISTER_ROUTE = "http://localhost:9000/auth/register";
const GOOGLE_LOGIN_URL = "https://prpo.purplebear.io/auth/google";
const REGISTER_ROUTE = "https://prpo.purplebear.io/auth/register";

const Register = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAuth } = useAuth();

  const register = async () => {
    if (!username || !password) {
      return;
    }

    const response = await fetch(REGISTER_ROUTE, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        username,
        password,
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      return toast.error(ensureErrorMessage(errorResponse));
    }

    toast.success("Registration successful");

    await checkAuth();
    const from =
      (location.state as { from?: Location })?.from?.pathname || "/app";
    navigate(from, { replace: true });
  };

  const handleSignInClick = () => {
    navigate("/login");
  };

  const handleGoogleRegister = () => {
    window.location.href = GOOGLE_LOGIN_URL;
  };

  return (
    <div className="login">
      <div className="login-box">
        <span className="login-title">Hi, welcome! 🤡</span>
        <div className="input-container">
          <input
            type="text"
            required
            value={username}
            placeholder="Enter your username"
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            required
            value={password}
            placeholder="Enter your password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="button-container">
          <button className="primary" onClick={() => register()}>
            Register
          </button>
        </div>
        <div className="divider">
          <div className="line"></div>
          <div className="continue-text">Or continue with</div>
          <div className="line"></div>
        </div>
        <div className="button-container">
          <button className="secondary" onClick={() => handleGoogleRegister()}>
            Sign up with Google
          </button>
        </div>

        <div className="register-prompt">
          Already have an account?{" "}
          <span className="register-button" onClick={() => handleSignInClick()}>
            Sign in!
          </span>
        </div>
      </div>
    </div>
  );
};

export default Register;
