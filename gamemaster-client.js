// gamemaster-client.js
// IP from CLAUDE.md
const BACKOFFICE_URL = "http://192.168.10.1:3000";

// Ensure Socket.IO is loaded
if (typeof io === 'undefined') {
    console.error("ERREUR: Socket.IO n'est pas chargé. Vérifiez l'import dans le HTML.");
}

const socket = io(BACKOFFICE_URL);

const gamemaster = {
  /**
   * 1. Register: Identification du jeu au démarrage
   */
  register(gameId, name, availableActions = []) {
    console.log(`[SDK] Registering ${gameId}...`);
    socket.emit("register", { gameId, name, availableActions });
  },

  /**
   * 2. OnCommand: Réception des ordres du GM
   */
  onCommand(callback) {
    socket.on("command", (data) => {
      console.log(`[SDK] Commande reçue: ${data.action}`, data.payload);
      callback({ action: data.action, payload: data.payload });
    });
  },

  /**
   * 3. UpdateState: Envoyer l'état en temps réel (score, phase...)
   */
  updateState(state) {
    socket.emit("state_update", { state });
  },

  /**
   * 4. SendEvent: Envoyer un événement ponctuel (victoire, blocage)
   */
  sendEvent(name, data = {}) {
    console.log(`[SDK] Event sent: ${name}`);
    socket.emit("event", { name, data });
  },

  // Helpers de connexion
  onConnect(callback) { socket.on("connect", callback); },
  onDisconnect(callback) { socket.on("disconnect", callback); }
};