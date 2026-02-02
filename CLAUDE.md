# CLAUDE.md — Mini-jeu HTML pur (Digital Event 2026)

## Ce que tu dois savoir

Ce projet est un **mini-jeu** qui fait partie d'un escape game interactif. Il se connecte à un **backoffice gamemaster** via Socket.IO sur le réseau local (`192.168.10.1:3000`).

Tu n'as **rien à coder côté serveur**. Le serveur existe déjà sur une autre machine. Tu dois juste utiliser le SDK client fourni (`gamemaster-client.js`).

## Stack

- HTML / CSS / JavaScript pur (pas de framework, pas de build)
- Socket.IO client chargé depuis le backoffice via `<script>`

## Setup

```html
<!-- Toujours dans cet ordre, avant ton code -->
<script src="http://192.168.10.1:3000/socket.io/socket.io.js"></script>
<script src="gamemaster-client.js"></script>
```

Pas de npm, pas de build. Ouvrir le HTML dans un navigateur suffit (tant que le PC est sur le réseau local).

## Le SDK : `gamemaster-client.js`

Ce fichier expose un objet global `gamemaster` avec ces méthodes :

### `gamemaster.register(gameId, name, availableActions)`

Appeler **une seule fois** au chargement de la page. Enregistre le mini-jeu auprès du backoffice.

- `gameId` : identifiant unique du jeu (ex: `"laser"`, `"morse"`)
- `name` : nom affiché dans le dashboard (ex: `"Le Labyrinthe Laser"`)
- `availableActions` : actions déclenchables par le gamemaster

```js
gamemaster.register("laser", "Le Labyrinthe Laser", [
  { id: "reset", label: "Réinitialiser" },
  { id: "hint", label: "Afficher un indice", params: ["level"] },
]);
```

### `gamemaster.onCommand(callback)`

Écoute les commandes envoyées depuis le backoffice.

```js
gamemaster.onCommand(({ action, payload }) => {
  if (action === "reset") resetGame();
  if (action === "hint") showHint(payload.level);
});
```

### `gamemaster.updateState(state)`

Envoie l'état courant du jeu au backoffice. Appeler à chaque changement d'état important.

```js
gamemaster.updateState({ solved: true, attempts: 3 });
```

### `gamemaster.sendEvent(name, data)`

Envoie un événement ponctuel au backoffice.

```js
gamemaster.sendEvent("game_won", { time: 45 });
gamemaster.sendEvent("player_stuck", { since: 120 });
```

### `gamemaster.onConnect(callback)` / `gamemaster.onDisconnect(callback)`

Pour réagir à la connexion/déconnexion.

## Pattern d'intégration

```html
<script src="http://192.168.10.1:3000/socket.io/socket.io.js"></script>
<script src="gamemaster-client.js"></script>
<script>
  // 1. Register
  gamemaster.register("mon-jeu", "Mon Jeu", [
    { id: "reset", label: "Reset" },
  ]);

  // 2. Connexion
  gamemaster.onConnect(() => console.log("Connecté au backoffice"));

  // 3. Commandes
  gamemaster.onCommand(({ action, payload }) => {
    if (action === "reset") location.reload();
  });

  // 4. Mise à jour d'état
  gamemaster.updateState({ started: true });

  // 5. Événements
  gamemaster.sendEvent("game_won");
</script>
```

## Règles importantes

1. **Un seul `register()`** par page, au chargement
2. **`availableActions`** = les boutons du gamemaster dans le dashboard
3. **`updateState()`** à chaque changement d'état significatif
4. **`sendEvent()`** pour les moments clés (victoire, blocage)
5. Le `gameId` doit être **unique** par mini-jeu sur le réseau
6. IP backoffice : `192.168.10.1:3000`

## Conventions

- Code en anglais
- UI en français
- Fichiers en kebab-case
