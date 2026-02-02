import { useState, useEffect } from 'react';
import './Home.css';
import Game from '../Game/Game';

export default function Home() {
  const [showGame, setShowGame] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setShowGame(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (showGame) {
    return <Game />;
  }

  return (
    <div className="home-screen">
      <div className="home-container">
        <h1 className="home-title">ACCÈS AUTORISÉ</h1>
        <div className="home-status">
          <span className="status-icon">&#10003;</span>
          AUTHENTIFICATION RÉUSSIE
        </div>
        <p className="home-message">
          Accès au gestionnaire de packages dans
        </p>
        <div className="countdown">{countdown}</div>
      </div>
    </div>
  );
}
