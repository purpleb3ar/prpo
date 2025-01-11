import { useState } from "react";
import "./index.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../app/auth";
import { toast } from "react-toastify";
import { ensureErrorMessage } from "../../shared/helpers/ensureErrorMessage";

// const LOGIN_ROUTE = "http://localhost:9000/auth/login";
// const GOOGLE_LOGIN_URL = "http://localhost:9000/auth/google";

const LOGIN_ROUTE = "https://prpo.purplebear.io/auth/login";
const GOOGLE_LOGIN_URL = "https://prpo.purplebear.io/auth/google";

const Login: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();

  const { checkAuth } = useAuth();

  const login = async () => {
    if (!username || !password) {
      return;
    }

    const response = await fetch(LOGIN_ROUTE, {
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

    await checkAuth();
    const from =
      (location.state as { from?: Location })?.from?.pathname || "/app";

    return navigate(from, { replace: true });
  };

  const handleGoogleLogin = () => {
    window.location.href = GOOGLE_LOGIN_URL;
  };

  const handleSignupClick = () => {
    navigate("/register");
  };

  return (
    <div className="login">
      <div className="login-box">
        <span className="login-title">Hi, welcome back! 🤡</span>
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
          <button className="primary" onClick={() => login()}>
            Login
          </button>
        </div>
        <div className="divider">
          <div className="line"></div>
          <div className="continue-text">Or continue with</div>
          <div className="line"></div>
        </div>
        <div className="button-container">
          <button className="secondary" onClick={() => handleGoogleLogin()}>
            Login with Google
          </button>
        </div>

        <div className="register-prompt">
          Don't have an account?{" "}
          <span className="register-button" onClick={() => handleSignupClick()}>
            Sign up!
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
