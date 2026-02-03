import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";

interface SidequestState {
  // Navigation
  currentScreen: "lockscreen" | "home" | "game";
  // LockScreen
  startScreen: boolean;
  isPasswordCorrect: boolean;
  passwordEntered: string;
  // Game
  score: number;
  phase: number;
  in_progress: boolean;
}

interface GamemasterContextType {
  state: SidequestState;
  updateState: (partial: Partial<SidequestState>) => void;
  sendEvent: (name: string, data?: Record<string, unknown>) => void;
}

const GamemasterContext = createContext<GamemasterContextType | null>(null);

// Store command handlers by screen
type CommandHandler = (
  action: string,
  payload: Record<string, unknown>,
) => void;

let commandHandlers: Map<string, CommandHandler> = new Map();

export function registerCommandHandler(
  screen: string,
  handler: CommandHandler,
) {
  commandHandlers.set(screen, handler);
}

export function unregisterCommandHandler(screen: string) {
  commandHandlers.delete(screen);
}

export function GamemasterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SidequestState>({
    currentScreen: "lockscreen",
    startScreen: false,
    isPasswordCorrect: false,
    passwordEntered: "",
    score: 0,
    phase: 0,
    in_progress: false,
  });

  const registeredRef = useRef(false);
  const currentScreenRef = useRef<"lockscreen" | "home" | "game">("lockscreen");

  // Keep ref in sync with state
  useEffect(() => {
    currentScreenRef.current = state.currentScreen;
  }, [state.currentScreen]);

  // Single registration at mount
  useEffect(() => {
    const initGamemaster = () => {
      if (window.gamemaster && !registeredRef.current) {
        registeredRef.current = true;

        window.gamemaster.register("sidequest", "Sidequest", [
          // LockScreen actions
          { id: "start_screen", label: "Activer l'écran (ARIA méchante)" },
          { id: "enter_solution", label: "Entrer la solution" },
          // Game actions
          { id: "skip_phase", label: "Force Finish Task" },
          { id: "add_points", label: "+1 Point" },
          { id: "remove_points", label: "-1 Point" },
          // Common
          { id: "reset", label: "Reset" },
        ]);

        window.gamemaster.onConnect(() => {
          console.log("Sidequest: Connecté au backoffice");
        });

        window.gamemaster.onDisconnect(() => {
          console.log("Sidequest: Déconnecté du backoffice");
        });

        window.gamemaster.onCommand(({ action, payload }) => {
          console.log("GM Command received:", action, payload);
          console.log("Current screen:", currentScreenRef.current);
          console.log(
            "Registered handlers:",
            Array.from(commandHandlers.keys()),
          );

          // Send command to ALL registered handlers (let each handler decide if it cares)
          commandHandlers.forEach((handler, screen) => {
            console.log("Calling handler for screen:", screen);
            handler(action, payload || {});
          });

          // Handle global reset
          if (action === "reset") {
            setState({
              currentScreen: "lockscreen",
              startScreen: false,
              isPasswordCorrect: false,
              passwordEntered: "",
              score: 0,
              phase: 0,
              in_progress: false,
            });
            window.location.href = "/";
          }
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

  // Sync state with backoffice
  useEffect(() => {
    if (window.gamemaster && registeredRef.current) {
      // Calculate explicit workflowStep
      let workflowStep: string;
      if (state.currentScreen === "lockscreen" && !state.startScreen) {
        workflowStep = "reset";
      } else if (state.currentScreen === "lockscreen" && !state.isPasswordCorrect) {
        workflowStep = "locked";
      } else if (state.currentScreen === "home") {
        workflowStep = "unlocked";
      } else if (state.currentScreen === "game" && state.in_progress) {
        workflowStep = "game_running";
      } else {
        workflowStep = "unknown";
      }

      // Calculate displayScreen for UI display
      let displayScreen: string;
      if (state.currentScreen === "lockscreen") {
        displayScreen = state.startScreen ? "Écran de connexion" : "Écran noir";
      } else if (state.currentScreen === "home") {
        displayScreen = "Écran d'accueil";
      } else if (state.currentScreen === "game") {
        displayScreen = `Jeu - Phase ${state.phase}/6`;
      } else {
        displayScreen = "État inconnu";
      }

      // Format state for backoffice display
      const formattedState = {
        ...state,
        workflowStep,
        displayScreen,
        passwordEntered: state.passwordEntered || "(vide)",
        codeStatus: state.isPasswordCorrect
          ? "Correct"
          : state.passwordEntered
            ? "En saisie"
            : "En attente",
      };
      window.gamemaster.updateState(formattedState);
    }
  }, [state]);

  const updateState = useCallback((partial: Partial<SidequestState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const sendEvent = useCallback(
    (name: string, data?: Record<string, unknown>) => {
      if (window.gamemaster) {
        window.gamemaster.sendEvent(name, data);
      }
    },
    [],
  );

  return (
    <GamemasterContext.Provider value={{ state, updateState, sendEvent }}>
      {children}
    </GamemasterContext.Provider>
  );
}

export function useGamemaster() {
  const ctx = useContext(GamemasterContext);
  if (!ctx)
    throw new Error("useGamemaster must be used within GamemasterProvider");
  return ctx;
}
