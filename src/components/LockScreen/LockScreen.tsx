import { useState, useEffect, useCallback, useRef } from "react";
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

  // Refs for typing animation to avoid closure stale issues
  const typeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typeIndexRef = useRef(0);

  const navigate = useNavigate();
  const { state, updateState, sendEvent } = useGamemaster();

  // Cleanup function for typing animation
  const stopTypingAnimation = useCallback(() => {
    if (typeTimeoutRef.current) {
      clearTimeout(typeTimeoutRef.current);
      typeTimeoutRef.current = null;
    }
    typeIndexRef.current = 0;
    setIsTypingAnimation(false);
  }, []);

  // Update screen state on mount
  useEffect(() => {
    updateState({ currentScreen: "lockscreen" });
  }, [updateState]);

  // Cleanup typing animation on unmount
  useEffect(() => {
    return () => {
      stopTypingAnimation();
    };
  }, [stopTypingAnimation]);

  // Register command handler for this screen
  useEffect(() => {
    const handleCommand = (
      action: string,
      payload: Record<string, unknown>,
    ) => {
      if (action === "start_screen") {
        updateState({ startScreen: true });
      }

      if (action === "enter_solution") {
        // Stop any previous animation
        stopTypingAnimation();

        const solution = CORRECT_PASSWORD;

        // Reset state properly
        setPassword("");
        typeIndexRef.current = 0;
        setIsTypingAnimation(true);

        // Use recursive setTimeout instead of setInterval to avoid closure issues
        const typeNextChar = () => {
          const currentIndex = typeIndexRef.current;

          if (currentIndex < solution.length) {
            // Use index from ref (always up to date)
            setPassword((prev) => prev + solution[currentIndex]);
            typeIndexRef.current++;

            // Schedule next character
            typeTimeoutRef.current = setTimeout(typeNextChar, 150);
          } else {
            // Animation complete
            stopTypingAnimation();
          }
        };

        // Start animation after a small delay to ensure setPassword("") is applied
        typeTimeoutRef.current = setTimeout(typeNextChar, 150);
      }

      if (action === "reset") {
        stopTypingAnimation();
        setPassword("");
        setError(false);
        setShake(false);
      }
    };

    registerCommandHandler("lockscreen", handleCommand);
    return () => {
      unregisterCommandHandler("lockscreen");
      stopTypingAnimation();
    };
  }, [updateState, stopTypingAnimation]);

  const validatePassword = useCallback(() => {
    const isCorrect = password.toLowerCase() === CORRECT_PASSWORD.toLowerCase();

    sendEvent("password_attempt", {
      passwordEntered: password,
      isCorrect,
    });

    if (isCorrect) {
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
  }, [password, sendEvent, updateState, navigate]);

  // Sync password state and auto-validate when all boxes are filled
  useEffect(() => {
    if (!isTypingAnimation) {
      updateState({ passwordEntered: password });

      // Auto-validate when password length matches
      if (password.length === CORRECT_PASSWORD.length) {
        validatePassword();
      }
    }
  }, [password, isTypingAnimation, updateState, validatePassword]);

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

        <div className="lock-form">
          <div className="code-input-wrapper">
            <input
              type="text"
              value={password}
              onChange={(e) => {
                if (!isTypingAnimation && e.target.value.length <= CORRECT_PASSWORD.length) {
                  setPassword(e.target.value);
                }
              }}
              className="hidden-input"
              autoFocus
              disabled={isTypingAnimation}
              maxLength={CORRECT_PASSWORD.length}
            />
            <div
              className={`code-boxes ${shake ? "shake" : ""} ${isTypingAnimation ? "typing" : ""}`}
              onClick={() => {
                const input = document.querySelector('.hidden-input') as HTMLInputElement;
                input?.focus();
              }}
            >
              {Array.from({ length: CORRECT_PASSWORD.length }).map((_, index) => (
                <div key={index} className={`code-box ${password[index] ? "filled" : ""}`}>
                  {password[index] ? "●" : "_"}
                </div>
              ))}
            </div>
          </div>
        </div>

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
