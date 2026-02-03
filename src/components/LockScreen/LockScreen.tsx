import { useState, useEffect } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGamemaster,
  registerCommandHandler,
  unregisterCommandHandler,
} from "../../context/GamemasterContext";
import "./LockScreen.css";

const CORRECT_PASSWORD = "admin";

export default function LockScreen() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [isTypingAnimation, setIsTypingAnimation] = useState(false);
  const navigate = useNavigate();
  const { state, updateState, sendEvent } = useGamemaster();

  // Update screen state on mount
  useEffect(() => {
    updateState({ currentScreen: "lockscreen" });
  }, [updateState]);

  // Register command handler for this screen
  useEffect(() => {
    const handleCommand = (
      action: string,
      payload: Record<string, unknown>,
    ) => {
      if (action === "start_screen") {
        updateState({ startScreen: true });
      }

      if (action === "set_code" && payload?.code) {
        const codeToType = String(payload.code);
        setPassword("");
        setIsTypingAnimation(true);

        let index = 0;
        const typeInterval = setInterval(() => {
          if (index < codeToType.length) {
            setPassword((prev) => prev + codeToType[index]);
            index++;
          } else {
            clearInterval(typeInterval);
            setIsTypingAnimation(false);
          }
        }, 150);
      }

      if (action === "reset") {
        setPassword("");
        setError(false);
        setShake(false);
      }
    };

    registerCommandHandler("lockscreen", handleCommand);
    return () => unregisterCommandHandler("lockscreen");
  }, [updateState]);

  // Sync password state
  useEffect(() => {
    if (!isTypingAnimation) {
      updateState({ passwordEntered: password });
    }
  }, [password, isTypingAnimation, updateState]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    validatePassword();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      validatePassword();
    }
  };

  const validatePassword = () => {
    sendEvent("password_attempt", {
      passwordEntered: password,
      isCorrect: password === CORRECT_PASSWORD,
    });

    if (password === CORRECT_PASSWORD) {
      sendEvent("password_correct", { isPasswordCorrect: true });
      updateState({ isPasswordCorrect: true, passwordEntered: password });
      navigate("/home");
    } else {
      sendEvent("password_incorrect", {
        isPasswordCorrect: false,
        passwordEntered: password,
      });

      setError(true);
      setShake(true);
      setPassword("");

      setTimeout(() => {
        setShake(false);
      }, 500);

      setTimeout(() => {
        setError(false);
      }, 3000);
    }
  };

  // If startScreen is false, show black screen
  if (!state.startScreen) {
    return (
      <div className="lock-screen loading-screen">
        {/* Écran totalement noir */}
      </div>
    );
  }

  return (
    <div className="lock-screen">
      {/* CRT Effects */}
      <div className="crt"></div>
      <div className="scanline"></div>
      <div className="scanline-bar"></div>
      <div className="noise"></div>
      <div className="rgb-split"></div>
      <div className="screen-glow"></div>

      <div className="lock-container">
        <div className="terminal-header">
          <span>TERMINAL v2.4.1</span>
          <span className="terminal-status">
            <svg
              className="lock-icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="3"
                y="11"
                width="18"
                height="11"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M7 11V7a5 5 0 0 1 10 0v4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </div>

        <h1 className="lock-title">SYSTÈME VERROUILLÉ</h1>

        <form onSubmit={handleSubmit} className="lock-form">
          <div
            className={`input-container ${shake ? "shake" : ""} ${isTypingAnimation ? "typing" : ""}`}
          >
            <span className="input-prefix">&gt;</span>
            <input
              type="password"
              value={password}
              onChange={(e) =>
                !isTypingAnimation && setPassword(e.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="ENTREZ LE CODE D'ACCÈS"
              className="lock-input"
              autoFocus
              disabled={isTypingAnimation}
            />
          </div>

          <button
            type="submit"
            className="lock-button"
            disabled={isTypingAnimation}
          >
            [VALIDER]
          </button>
        </form>

        {error && (
          <div className="error-message">
            <span className="error-icon">!</span>
            ACCÈS REFUSÉ - MOT DE PASSE INCORRECT
          </div>
        )}

        <div className="terminal-footer">
          <div className="footer-stats">
            <div className="footer-line">
              &gt; En attente d'authentification...
            </div>
            <span>PROTOCOLE: ALPHA-7</span>
          </div>
        </div>
      </div>
    </div>
  );
}
