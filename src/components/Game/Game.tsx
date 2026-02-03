import { useEffect, useRef, useState } from 'react';
import { useGamemaster, registerCommandHandler, unregisterCommandHandler } from '../../context/GamemasterContext';
import './Game.css';

const CONFIG = {
  phase1Clicks: 10,
  phase2Targets: 6,
  phase3CodeLength: 4,
  phase3Time: 5000,
  phase4Pairs: 4,
  phase6Rounds: 3,
  phase6Speed: 3,
  delayTime: 1500,
};

export default function Game() {
  const [totalSent, setTotalSent] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [taskProgress, setTaskProgress] = useState(0);
  const [taskMax, setTaskMax] = useState(10);
  const [logs, setLogs] = useState<string[]>(['Système de transfert prêt.', "En attente de l'opérateur..."]);
  const [gameStarted, setGameStarted] = useState(false);
  const [showSendingOverlay, setShowSendingOverlay] = useState(false);

  const phaseQueueRef = useRef<number[]>([]);
  const lastPhasePlayedRef = useRef(0);
  const captchaIntervalRef = useRef<number | null>(null);
  const skillFrameRef = useRef<number | null>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const finishPackageRef = useRef<() => void>(() => {});

  const { updateState, sendEvent } = useGamemaster();

  // Update screen state on mount
  useEffect(() => {
    updateState({ currentScreen: 'game' });
  }, [updateState]);

  const addLog = (msg: string) => {
    setLogs((prev) => {
      const newLogs = [...prev, msg];
      if (newLogs.length > 5) newLogs.shift();
      return newLogs;
    });
  };

  const syncState = (score: number, phase: number) => {
    updateState({
      score,
      phase,
      in_progress: true,
    });
  };

  const generateQueue = () => {
    const batch = [1, 2, 3, 4, 5, 6];
    for (let i = batch.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [batch[i], batch[j]] = [batch[j], batch[i]];
    }
    if (lastPhasePlayedRef.current !== 0 && batch[0] === lastPhasePlayedRef.current) {
      const temp = batch[0];
      batch[0] = batch[batch.length - 1];
      batch[batch.length - 1] = temp;
    }
    phaseQueueRef.current = batch;
  };

  const finishPackage = () => {
    if (captchaIntervalRef.current) {
      clearInterval(captchaIntervalRef.current);
      captchaIntervalRef.current = null;
    }
    if (skillFrameRef.current) {
      cancelAnimationFrame(skillFrameRef.current);
      skillFrameRef.current = null;
    }

    setShowSendingOverlay(true);
    setTotalSent((prev) => {
      const newTotal = prev + 1;

      sendEvent('point_earned', {
        points: 1,
        totalPoints: newTotal
      });
      sendEvent('resource_transferred', { total: newTotal });
      syncState(newTotal, currentPhase);
      return newTotal;
    });

    addLog('TRANSFERT REUSSI. PAQUET ENVOYÉ.');

    setTimeout(() => {
      setTaskProgress(0);
      setShowSendingOverlay(false);
      selectNextPhase();
    }, CONFIG.delayTime);
  };

  // Keep ref updated
  useEffect(() => {
    finishPackageRef.current = finishPackage;
  });

  const updateTaskProgress = (val: number, max: number) => {
    setTaskProgress(val);
    setTaskMax(max);
    if (val >= max) {
      finishPackage();
    }
  };

  const selectNextPhase = () => {
    if (phaseQueueRef.current.length === 0) generateQueue();
    const next = phaseQueueRef.current.shift()!;
    lastPhasePlayedRef.current = next;
    setCurrentPhase(next);
    setTaskProgress(0);
    syncState(totalSent, next);
  };

  // Register command handler for this screen
  useEffect(() => {
    const handleCommand = (action: string) => {
      if (action === 'skip_phase') {
        addLog('>> OVERRIDE: SAUT DE PHASE FORCÉ PAR GM');
        finishPackageRef.current();
      }
      if (action === 'add_points') {
        setTotalSent((prev) => prev + 1);
        addLog('>> BONUS: RESSOURCE AJOUTÉE PAR GM');
      }
      if (action === 'remove_points') {
        setTotalSent((prev) => (prev > 0 ? prev - 1 : 0));
        addLog('>> MALUS: RESSOURCE SUPPRIMÉE PAR GM');
      }
    };

    registerCommandHandler('game', handleCommand);
    return () => unregisterCommandHandler('game');
  }, []);

  // Auto-start the game on mount
  useEffect(() => {
    sendEvent('game_started');
    setGameStarted(true);
    selectNextPhase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pct = taskMax > 0 ? Math.floor((taskProgress / taskMax) * 100) : 0;

  return (
    <div className="game-wrapper">
      <div className="crt-overlay"></div>

      <div className="container">
        <header>
          <div className="header-left">
            <svg viewBox="0 0 200 180" className="aria-mascot-svg">
              <path
                d="M 35 110 L 30 35 L 65 75 Q 100 55, 135 75 L 170 35 L 165 110 C 175 140, 145 175, 100 175 C 55 175, 25 140, 35 110 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <g className="eye">
                <path
                  d="M 55 115 Q 65 100, 100 85 Q 135 100, 145 115 Q 135 130, 100 145 Q 65 130, 55 115 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <line x1="100" y1="95" x2="100" y2="135" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </g>
              <line x1="0" y1="100" x2="45" y2="115" stroke="currentColor" strokeWidth="2" />
              <line x1="-5" y1="120" x2="45" y2="125" stroke="currentColor" strokeWidth="2" />
              <line x1="0" y1="140" x2="45" y2="135" stroke="currentColor" strokeWidth="2" />
              <line x1="155" y1="115" x2="200" y2="100" stroke="currentColor" strokeWidth="2" />
              <line x1="155" y1="125" x2="205" y2="120" stroke="currentColor" strokeWidth="2" />
              <line x1="155" y1="135" x2="200" y2="140" stroke="currentColor" strokeWidth="2" />
            </svg>
            <div className="header-info">
              <div className="header-title">UPLINK V7.0</div>
              <div className="header-sub">CONNECTION: ARIA SECURE</div>
            </div>
          </div>

          <div className="resource-box">
            <div className="resource-label">TOTAL UPLOAD</div>
            <div className="resource-value">{totalSent}</div>
          </div>
        </header>

        <div className="status-row">
          <span>PAQUET EN COURS...</span>
          <span>{pct}%</span>
        </div>
        <div className="upload-container">
          <div className="upload-bar" style={{ width: `${pct}%` }}></div>
        </div>

        <div id="game-area" ref={gameAreaRef}>
          {showSendingOverlay && (
            <div className="sending-overlay">
              <div className="sending-text">ENVOI DU PAQUET...</div>
              <div style={{ color: 'var(--color-primary)', fontSize: '1.2rem' }}>TRANSFERT RESSOURCE &gt;&gt; JOUEUR</div>
            </div>
          )}


          {gameStarted && !showSendingOverlay && currentPhase === 1 && (
            <Phase1Clicker
              config={CONFIG}
              onProgress={updateTaskProgress}
              addLog={addLog}
            />
          )}

          {gameStarted && !showSendingOverlay && currentPhase === 2 && (
            <Phase2Targets
              config={CONFIG}
              onProgress={updateTaskProgress}
              addLog={addLog}
            />
          )}

          {gameStarted && !showSendingOverlay && currentPhase === 3 && (
            <Phase3Captcha
              config={CONFIG}
              onProgress={updateTaskProgress}
              addLog={addLog}
              captchaIntervalRef={captchaIntervalRef}
            />
          )}

          {gameStarted && !showSendingOverlay && currentPhase === 4 && (
            <Phase4Wires
              config={CONFIG}
              onProgress={updateTaskProgress}
              addLog={addLog}
            />
          )}

          {gameStarted && !showSendingOverlay && currentPhase === 5 && (
            <Phase5Hex
              onProgress={updateTaskProgress}
              addLog={addLog}
            />
          )}

          {gameStarted && !showSendingOverlay && currentPhase === 6 && (
            <Phase6SkillCheck
              config={CONFIG}
              onProgress={updateTaskProgress}
              addLog={addLog}
              skillFrameRef={skillFrameRef}
            />
          )}
        </div>

        <div id="log-area">
          {logs.map((log, idx) => (
            <div key={idx} className="log-entry">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Phase 1: Clicker
function Phase1Clicker({
  config,
  onProgress,
  addLog,
}: {
  config: typeof CONFIG;
  onProgress: (val: number, max: number) => void;
  addLog: (msg: string) => void;
}) {
  const [clicks, setClicks] = useState(0);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      addLog('TÂCHE : Compresser les données');
      onProgress(0, config.phase1Clicks);
      initialized.current = true;
    }
  }, []);

  const handleClick = () => {
    const newClicks = clicks + 1;
    setClicks(newClicks);
    onProgress(newClicks, config.phase1Clicks);
  };

  return (
    <div className="btn-primary" onClick={handleClick}>
      COMPRESSER
    </div>
  );
}

// Phase 2: Targets
function Phase2Targets({
  config,
  onProgress,
  addLog,
}: {
  config: typeof CONFIG;
  onProgress: (val: number, max: number) => void;
  addLog: (msg: string) => void;
}) {
  const [collected, setCollected] = useState(0);
  const [targetPos, setTargetPos] = useState({ top: '50%', left: '50%' });
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      addLog('TÂCHE : Récupérer les fragments');
      onProgress(0, config.phase2Targets);
      spawnTarget();
      initialized.current = true;
    }
  }, []);

  const spawnTarget = () => {
    setTargetPos({
      top: `${Math.floor(Math.random() * 80) + 10}%`,
      left: `${Math.floor(Math.random() * 80) + 10}%`,
    });
  };

  const handleClick = () => {
    const newCollected = collected + 1;
    setCollected(newCollected);
    onProgress(newCollected, config.phase2Targets);
    if (newCollected < config.phase2Targets) {
      spawnTarget();
    }
  };

  return (
    <>
      <div style={{ position: 'absolute', top: '10px', color: 'var(--color-primary)' }}>COLLECTE DE DONNÉES...</div>
      {collected < config.phase2Targets && (
        <div
          className="target-node"
          style={{ top: targetPos.top, left: targetPos.left }}
          onMouseDown={handleClick}
        >
          DATA
        </div>
      )}
    </>
  );
}

// Phase 3: Captcha
function Phase3Captcha({
  config,
  onProgress,
  addLog,
  captchaIntervalRef,
}: {
  config: typeof CONFIG;
  onProgress: (val: number, max: number) => void;
  addLog: (msg: string) => void;
  captchaIntervalRef: React.MutableRefObject<number | null>;
}) {
  const [seq, setSeq] = useState('');
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(config.phase3Time);
  const [inputColor, setInputColor] = useState('var(--color-primary)');
  const initialized = useRef(false);

  const generateCode = () => {
    let code = '';
    for (let i = 0; i < config.phase3CodeLength; i++) {
      code += Math.floor(Math.random() * 2);
    }
    setSeq(code);
    setInput('');
    setTimeLeft(config.phase3Time);
  };

  useEffect(() => {
    if (!initialized.current) {
      addLog('TÂCHE : Saisie Code Sécurité');
      onProgress(0, 1);
      generateCode();
      initialized.current = true;
    }

    captchaIntervalRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 50;
        if (newTime <= 0) {
          setInputColor('var(--color-danger)');
          setTimeout(() => setInputColor('var(--color-primary)'), 200);
          generateCode();
          return config.phase3Time;
        }
        return newTime;
      });
    }, 50);

    return () => {
      if (captchaIntervalRef.current) {
        clearInterval(captchaIntervalRef.current);
      }
    };
  }, []);

  const handleInput = (key: string) => {
    if (key === '<') {
      setInput((prev) => prev.slice(0, -1));
    } else if (input.length < seq.length) {
      const newInput = input + key;
      setInput(newInput);

      if (newInput.length === seq.length) {
        if (newInput === seq) {
          if (captchaIntervalRef.current) {
            clearInterval(captchaIntervalRef.current);
          }
          onProgress(1, 1);
        } else {
          setInputColor('var(--color-danger)');
          setTimeout(() => setInputColor('var(--color-primary)'), 200);
          setInput('');
        }
      }
    }
  };

  return (
    <div className="terminal-container">
      <div className="captcha-box">
        <div style={{ fontSize: '0.8rem', letterSpacing: '2px', opacity: 0.8, marginBottom: '5px' }}>CODE DE SÉCURITÉ</div>
        <div className="sequence-display">{seq.split('').join(' ')}</div>
        <div className="timer-track">
          <div className="timer-fill" style={{ width: `${(timeLeft / config.phase3Time) * 100}%` }}></div>
        </div>
      </div>
      <div style={{ color: inputColor, fontSize: '2rem', marginBottom: '15px', fontWeight: 'bold' }}>&gt; {input || '_'}</div>
      <div className="keypad">
        {['0', '1', '<'].map((key) => (
          <button
            key={key}
            className={`key-btn ${key === '<' ? 'key-back' : ''}`}
            onClick={() => handleInput(key)}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}

// Phase 4: Wires
function Phase4Wires({
  config,
  onProgress,
  addLog,
}: {
  config: typeof CONFIG;
  onProgress: (val: number, max: number) => void;
  addLog: (msg: string) => void;
}) {
  const [connections, setConnections] = useState(0);
  const [connectedDots, setConnectedDots] = useState<Set<string>>(new Set());
  const [lines, setLines] = useState<Array<{ x1: number; y1: number; x2: number; y2: number }>>([]);
  const [dragLine, setDragLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [startDot, setStartDot] = useState<{ id: number; side: string } | null>(null);
  const [showGhost, setShowGhost] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);
  const initialized = useRef(false);

  const shapes = ['■', '▲', '◆', '●'];
  const [leftIdx] = useState(() => [0, 1, 2, 3].sort(() => Math.random() - 0.5));
  const [rightIdx] = useState(() => [0, 1, 2, 3].sort(() => Math.random() - 0.5));

  useEffect(() => {
    if (!initialized.current) {
      addLog('TÂCHE : Connecter les flux');
      onProgress(0, config.phase4Pairs);
      initialized.current = true;
    }
  }, []);

  const handleMouseDown = (id: number, side: string, e: React.MouseEvent) => {
    const key = `${side}-${id}`;
    if (connectedDots.has(key)) return;

    setShowGhost(false);
    setStartDot({ id, side });

    if (svgRef.current) {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const svgRect = svgRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2 - svgRect.left;
      const y = rect.top + rect.height / 2 - svgRect.top;
      setDragLine({ x1: x, y1: y, x2: x, y2: y });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragLine && svgRef.current) {
        const svgRect = svgRef.current.getBoundingClientRect();
        setDragLine((prev) =>
          prev ? { ...prev, x2: e.clientX - svgRect.left, y2: e.clientY - svgRect.top } : null
        );
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (dragLine && startDot && svgRef.current) {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (el && el.classList.contains('wire-dot')) {
          const targetId = parseInt(el.getAttribute('data-id') || '-1');
          const targetSide = el.getAttribute('data-side');

          if (targetSide !== startDot.side && targetId === startDot.id) {
            const rect = el.getBoundingClientRect();
            const svgRect = svgRef.current.getBoundingClientRect();

            setLines((prev) => [
              ...prev,
              {
                x1: dragLine.x1,
                y1: dragLine.y1,
                x2: rect.left + rect.width / 2 - svgRect.left,
                y2: rect.top + rect.height / 2 - svgRect.top,
              },
            ]);

            setConnectedDots((prev) => {
              const newSet = new Set(prev);
              newSet.add(`${startDot.side}-${startDot.id}`);
              newSet.add(`${targetSide}-${targetId}`);
              return newSet;
            });

            const newConnections = connections + 1;
            setConnections(newConnections);
            onProgress(newConnections, config.phase4Pairs);
          }
        }
      }
      setDragLine(null);
      setStartDot(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragLine, startDot, connections]);

  return (
    <>
      <div className="tutorial-text">RELIER LES PAIRES</div>

      {showGhost && (
        <div className="ghost-demo">
          <div className="ghost-dot-start"></div>
          <div className="ghost-line"></div>
          <div className="ghost-hand">👆</div>
        </div>
      )}

      <svg ref={svgRef} id="svg-canvas">
        {lines.map((line, idx) => (
          <line key={idx} className="wire-line" x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
        ))}
        {dragLine && <line className="wire-line" x1={dragLine.x1} y1={dragLine.y1} x2={dragLine.x2} y2={dragLine.y2} />}
      </svg>

      <div className="wire-col" style={{ left: '10%' }}>
        {leftIdx.map((n) => (
          <div
            key={n}
            className="wire-dot"
            data-id={n}
            data-side="left"
            data-connected={connectedDots.has(`left-${n}`) ? 'true' : undefined}
            onMouseDown={(e) => handleMouseDown(n, 'left', e)}
          >
            {shapes[n]}
          </div>
        ))}
      </div>

      <div className="wire-col" style={{ right: '10%' }}>
        {rightIdx.map((n) => (
          <div
            key={n}
            className="wire-dot"
            data-id={n}
            data-side="right"
            data-connected={connectedDots.has(`right-${n}`) ? 'true' : undefined}
            onMouseDown={(e) => handleMouseDown(n, 'right', e)}
          >
            {shapes[n]}
          </div>
        ))}
      </div>
    </>
  );
}

// Phase 5: Hex Grid
function Phase5Hex({
  onProgress,
  addLog,
}: {
  onProgress: (val: number, max: number) => void;
  addLog: (msg: string) => void;
}) {
  const [values, setValues] = useState<number[]>(() => {
    const arr = [];
    for (let i = 0; i < 8; i++) arr.push(Math.random() > 0.5 ? 1 : 0);
    if (arr.every((v) => v === 0) || arr.every((v) => v === 1)) arr[0] = 1 - arr[0];
    return arr;
  });
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      addLog('TÂCHE : Synchroniser la parité');
      onProgress(0, 1);
      initialized.current = true;
    }
  }, []);

  useEffect(() => {
    const allZero = values.every((v) => v === 0);
    const allOne = values.every((v) => v === 1);
    if (allZero || allOne) {
      setTimeout(() => onProgress(1, 1), 200);
    }
  }, [values]);

  const handleClick = (idx: number) => {
    setValues((prev) => {
      const newArr = [...prev];
      newArr[idx] = 1 - newArr[idx];
      return newArr;
    });
  };

  return (
    <div className="hex-grid">
      {values.map((val, idx) => (
        <div key={idx} className={`hex ${val === 1 ? 'active' : ''}`} onClick={() => handleClick(idx)}>
          {val}
        </div>
      ))}
    </div>
  );
}

// Phase 6: Skill Check
function Phase6SkillCheck({
  config,
  onProgress,
  addLog,
  skillFrameRef,
}: {
  config: typeof CONFIG;
  onProgress: (val: number, max: number) => void;
  addLog: (msg: string) => void;
  skillFrameRef: React.MutableRefObject<number | null>;
}) {
  const [rounds, setRounds] = useState(0);
  const [angle, setAngle] = useState(0);
  const [speed, setSpeed] = useState(config.phase6Speed);
  const [direction, setDirection] = useState(1);
  const [targetStart, setTargetStart] = useState(0);
  const [failAnim, setFailAnim] = useState(false);
  const targetWidth = 45;
  const initialized = useRef(false);
  const angleRef = useRef(0);
  const speedRef = useRef(config.phase6Speed);
  const directionRef = useRef(1);

  const resetZone = () => {
    const newTarget = Math.floor(Math.random() * 300) + 15;
    setTargetStart(newTarget);
  };

  useEffect(() => {
    if (!initialized.current) {
      addLog('TÂCHE : Calibrage rotatif');
      onProgress(0, config.phase6Rounds);
      resetZone();
      initialized.current = true;
    }

    const loop = () => {
      angleRef.current += speedRef.current * directionRef.current;
      if (angleRef.current >= 360) angleRef.current = 0;
      if (angleRef.current < 0) angleRef.current = 360;
      setAngle(angleRef.current);
      skillFrameRef.current = requestAnimationFrame(loop);
    };

    skillFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (skillFrameRef.current) {
        cancelAnimationFrame(skillFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  const handleClick = () => {
    let normAngle = angleRef.current;
    if (normAngle < 0) normAngle += 360;
    const hit = normAngle >= targetStart && normAngle <= targetStart + targetWidth;

    if (hit) {
      const newRounds = rounds + 1;
      setRounds(newRounds);
      onProgress(newRounds, config.phase6Rounds);
      if (newRounds < config.phase6Rounds) {
        resetZone();
        setSpeed((prev) => prev + 1);
        setDirection((prev) => prev * -1);
      }
    } else {
      setFailAnim(true);
      setTimeout(() => setFailAnim(false), 500);
      setSpeed(config.phase6Speed);
    }
  };

  const zoneStyle = {
    background: `conic-gradient(transparent ${targetStart}deg, rgba(255,255,255,0.2) ${targetStart}deg, var(--color-primary) ${targetStart + targetWidth}deg, transparent ${targetStart + targetWidth}deg)`,
  };

  return (
    <div className={`skill-container ${failAnim ? 'fail-anim' : ''}`}>
      <div className="skill-circle"></div>
      <div className="skill-zone" style={zoneStyle}></div>
      <div className="skill-needle" style={{ transform: `rotate(${angle}deg)` }}></div>
      <button className="skill-btn" onMouseDown={handleClick}>
        STOP
      </button>
    </div>
  );
}
