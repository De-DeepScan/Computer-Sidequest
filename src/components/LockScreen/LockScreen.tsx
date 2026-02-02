import { useState, useEffect, FormEvent, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import "./LockScreen.css";

// Declare gamemaster as global
declare global {
  interface Window {
    gamemaster: {
      register: (gameId: string, name: string, availableActions: Array<{ id: string; label: string; params?: string[] }>) => void;
      onCommand: (callback: (data: { action: string; payload?: Record<string, unknown> }) => void) => void;
      updateState: (state: Record<string, unknown>) => void;
      sendEvent: (name: string, data?: Record<string, unknown>) => void;
      onConnect: (callback: () => void) => void;
      onDisconnect: (callback: () => void) => void;
    };
  }
}

const CORRECT_PASSWORD = "124390L";

export default function LockScreen() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [startScreen, setStartScreen] = useState(false); // 1 - Écran de chargement avant affichage
  const [isTypingAnimation, setIsTypingAnimation] = useState(false); // 3 - Animation de saisie du back
  const navigate = useNavigate();

  // Initialize gamemaster
  useEffect(() => {
    const initGamemaster = () => {
      if (window.gamemaster) {
        window.gamemaster.register("sidequest-computer", "Sidequest: Computer", [
          { id: "start_screen", label: "🚀 Activer l'écran (ARIA méchante)" },
          { id: "set_code", label: "🔑 Entrer un code", params: ["code"] },
          { id: "reset", label: "🔄 Reset" },
        ]);

        window.gamemaster.onConnect(() => {
          console.log("Computer: Connecté au backoffice");
          syncState();
        });

        window.gamemaster.onDisconnect(() => {
          console.log("Computer: Déconnecté du backoffice");
        });

        window.gamemaster.onCommand(({ action, payload }) => {
          console.log("GM Command:", action, payload);

          // 1 - ARIA devient méchante, on active l'écran
          if (action === "start_screen") {
            setStartScreen(true);
            syncState(true);
          }

          // 3 - Le back envoie un code à afficher avec animation
          if (action === "set_code" && payload?.code) {
            const codeToType = String(payload.code);
            setPassword("");
            setIsTypingAnimation(true);

            // Animation de frappe caractère par caractère
            let index = 0;
            const typeInterval = setInterval(() => {
              if (index < codeToType.length) {
                setPassword(prev => prev + codeToType[index]);
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
            setStartScreen(false);
            syncState(false);
          }
        });

        // Initial state sync
        syncState();
      }
    };

    const syncState = (started?: boolean) => {
      if (window.gamemaster) {
        window.gamemaster.updateState({
          startScreen: started !== undefined ? started : startScreen,
          isPasswordCorrect: false,
          passwordEntered: password,
        });
      }
    };

    if (window.gamemaster) {
      initGamemaster();
    } else {
      const interval = setInterval(() => {
        if (window.gamemaster) {
          initGamemaster();
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  // Sync state when password changes
  useEffect(() => {
    if (window.gamemaster && !isTypingAnimation) {
      window.gamemaster.updateState({
        startScreen,
        isPasswordCorrect: false,
        passwordEntered: password,
      });
    }
  }, [password, startScreen]);

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
    // 4 - Envoyer le code exact au back
    if (window.gamemaster) {
      window.gamemaster.sendEvent("password_attempt", {
        passwordEntered: password,
        isCorrect: password === CORRECT_PASSWORD
      });
    }

    if (password === CORRECT_PASSWORD) {
      // 2 - Code validé, envoyer l'info au back
      if (window.gamemaster) {
        window.gamemaster.sendEvent("password_correct", { isPasswordCorrect: true });
        window.gamemaster.updateState({
          startScreen,
          isPasswordCorrect: true,
          passwordEntered: password,
        });
      }
      navigate("/home");
    } else {
      // 4 - Code incorrect, envoyer au back
      if (window.gamemaster) {
        window.gamemaster.sendEvent("password_incorrect", {
          isPasswordCorrect: false,
          passwordEntered: password
        });
      }

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

  // 1 - Si startScreen est false, afficher écran noir
  if (!startScreen) {
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
          <div className={`input-container ${shake ? "shake" : ""} ${isTypingAnimation ? "typing" : ""}`}>
            <span className="input-prefix">&gt;</span>
            <input
              type="password"
              value={password}
              onChange={(e) => !isTypingAnimation && setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ENTREZ LE CODE D'ACCÈS"
              className="lock-input"
              autoFocus
              disabled={isTypingAnimation}
            />
          </div>

          <button type="submit" className="lock-button" disabled={isTypingAnimation}>
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
