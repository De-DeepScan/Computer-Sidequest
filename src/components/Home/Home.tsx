import { useState, useEffect } from 'react';
import './Home.css';
import Game from '../Game/Game';

const TERMINAL_LINES_BASE = [
  ['> Initializing secure connection...', '> Bypassing firewall...', '> Access granted to node_7x42', '> Syncing remote database...', '> Establishing tunnel...'],
  ['$ sudo decrypt /vault/data', '$ chmod 777 /system/core', '> Extracting credentials...', '> Dumping memory 0xFFAA...', '> Buffer overflow detected'],
  ['[OK] Authentication verified', '[OK] Handshake complete', '> Loading kernel modules...', '> Patching security layer', '> Root access obtained'],
  ['> Mounting encrypted drive...', '> Decrypting sector 0x7F3A', '[DONE] Partition unlocked', '> Reading /etc/passwd', '> Hash: $6$xyz...redacted'],
  ['$ cat /etc/shadow', '> Hash collision detected', '> Overriding security protocol', '> Injecting shellcode...', '> Backdoor installed'],
  ['[SYS] Core access enabled', '> Injecting payload...', '> Connection established', '> Pivoting to internal net', '> Scanning ports 1-65535'],
  ['> nmap -sS 192.168.1.0/24', '> Found 47 live hosts', '> Vulnerability scan...', '> CVE-2024-0001 detected', '> Exploiting target...'],
  ['$ wget malware.bin', '> Download complete', '> chmod +x malware.bin', '> Executing payload...', '> Persistence established'],
  ['[CRYPTO] AES-256 bypass', '> Key extracted: ████████', '> Decryption successful', '> Sensitive data found', '> Exfiltrating 2.4GB...'],
  ['> ssh root@mainframe', '> Password accepted', '> Welcome to ARIA-CORE', '> Privilege escalation...', '> System compromised'],
  ['$ rm -rf /var/log/*', '> Clearing traces...', '> Log files deleted', '> Timestamps modified', '> Forensics bypassed'],
  ['[NET] Proxy chain active', '> Tor circuit established', '> IP: 185.xx.xx.xx', '> Location: UNKNOWN', '> Anonymity confirmed'],
  ['> hydra -l admin -P pass.txt', '> Attempting 10000 passwords', '> [22][ssh] host: 10.0.0.1', '> login: admin pass: ******', '> SUCCESS'],
  ['[MEM] Dumping RAM...', '> Process list acquired', '> Credentials in memory:', '> user: administrator', '> pass: Tr0ub4dor&3'],
  ['$ sqlmap -u target.com', '> Testing for SQLi...', '> Parameter vulnerable!', '> Dumping database...', '> Table: users (2847)'],
  ['[SCAN] Port 443 open', '> SSL/TLS v1.2 detected', '> Certificate: *.aria.local', '> Heartbleed vulnerable!', '> Extracting memory...'],
  ['> msfconsole -q', '> use exploit/multi/handler', '> set PAYLOAD windows/x64', '> set LHOST 10.10.14.5', '> exploit -j'],
  ['[DNS] Poisoning cache...', '> Spoofed: aria-core.com', '> Redirect: 10.10.14.5', '> Victims: 142 hosts', '> Phishing ready'],
  ['> whoami /priv', '> SeDebugPrivilege: Enabled', '> SeImpersonatePrivilege', '> Escalating to SYSTEM...', '> God mode activated'],
  ['$ tcpdump -i eth0', '> Capturing packets...', '> Found credentials in HTTP', '> Basic Auth decoded', '> user:pass harvested'],
  ['[BRUTE] SSH attack', '> 192.168.1.50:22', '> Trying 50000 combos...', '> Match found!', '> root:toor'],
  ['> mimikatz.exe', '> privilege::debug', '> sekurlsa::logonpasswords', '> NTLM: aad3b435...', '> Golden ticket forged'],
  ['$ john --wordlist=rockyou', '> Loaded 847 hashes', '> Cracking SHA512...', '> 423 passwords found', '> Success rate: 49.9%'],
  ['[FW] Firewall bypass', '> Rule injection...', '> Port 4444 opened', '> Reverse shell ready', '> iptables modified'],
  ['> netcat -lvp 9001', '> Listening on 0.0.0.0', '> Connection from target', '> Shell received!', '> Interactive TTY'],
  ['$ empire --rest', '> Stager generated', '> Launcher: powershell', '> Agent callback...', '> New agent: ARIA-01'],
  ['[PRIV] UAC bypass', '> fodhelper.exe exploit', '> Registry modified', '> High integrity shell', '> Admin access gained'],
  ['> bloodhound-python', '> Collecting AD data...', '> Users: 2847', '> Groups: 156', '> Path to DA found!'],
  ['$ responder -I eth0', '> LLMNR poisoning...', '> NTLM hash captured', '> user: svc_backup', '> Cracking offline...'],
  ['[EXFIL] Data staging', '> Compressing /data', '> Encrypting archive', '> DNS tunneling active', '> 2.4GB transferred'],
  ['> hashcat -m 1000 hash.txt', '> Loading wordlist...', '> Speed: 15.2 GH/s', '> Cracked: admin123', '> Session saved'],
  ['$ airmon-ng start wlan0', '> Monitor mode enabled', '> Scanning networks...', '> Found: ARIA-SECURE', '> Deauth attack...'],
  ['[LATERAL] psexec.py', '> Connecting to DC01', '> Admin share mounted', '> Executing payload...', '> Domain compromised'],
  ['> wmic /node:target', '> Process call create', '> cmd.exe spawned', '> Reverse callback...', '> Shell established'],
  ['$ volatility -f mem.dmp', '> Analyzing memory...', '> Process: lsass.exe', '> Extracting hashes...', '> Credentials dumped'],
  ['[PIVOT] SSH tunnel', '> -L 8080:internal:80', '> Port forward active', '> Accessing intranet', '> Internal scan...'],
  ['> certutil -urlcache', '> Downloading beacon', '> Execution via LOLBin', '> Defense evasion OK', '> Cobalt Strike'],
  ['$ crackmapexec smb', '> 192.168.1.0/24', '> Found 12 hosts', '> Admin access: 5', '> Dumping SAM...'],
  ['[KERBEROS] AS-REP', '> Roasting users...', '> Found: svc_sql', '> Hash extracted', '> Offline cracking'],
  ['> impacket-secretsdump', '> Dumping NTDS.dit', '> All domain hashes', '> krbtgt acquired', '> Golden ticket!'],
];

// Duplicate for more windows - fill the entire screen
const TERMINAL_LINES = [
  ...TERMINAL_LINES_BASE,
  ...TERMINAL_LINES_BASE,
  ...TERMINAL_LINES_BASE,
  ...TERMINAL_LINES_BASE,
  ...TERMINAL_LINES_BASE,
  ...TERMINAL_LINES_BASE,
];

// Generate random positions for chaotic appearance - fill entire screen
const generateRandomPositions = (count: number) => {
  const positions = [];
  for (let i = 0; i < count; i++) {
    positions.push({
      top: `${Math.random() * 90}%`,
      left: `${Math.random() * 88}%`,
    });
  }
  return positions;
};

interface TerminalWindow {
  id: number;
  lines: string[];
  position: { top: string; left: string };
  delay: number;
}

export default function Home() {
  const [phase, setPhase] = useState<'terminals' | 'game'>('terminals');
  const [terminals, setTerminals] = useState<TerminalWindow[]>([]);
  const [visibleTerminals, setVisibleTerminals] = useState<number[]>([]);
  const [showAccessOverlay, setShowAccessOverlay] = useState(false);

  // Generate terminal windows on mount
  useEffect(() => {
    const positions = generateRandomPositions(TERMINAL_LINES.length);

    const generatedTerminals = TERMINAL_LINES.map((lines, index) => ({
      id: index,
      lines,
      position: positions[index],
      delay: index * 8, // Instant chaos
    }));

    setTerminals(generatedTerminals);
  }, []);

  // Animate terminals appearing one by one
  useEffect(() => {
    if (phase !== 'terminals') return;

    terminals.forEach((terminal) => {
      setTimeout(() => {
        setVisibleTerminals((prev) => [...prev, terminal.id]);
      }, terminal.delay);
    });

    // After all terminals appear, show access overlay on top
    const totalDelay = terminals.length * 8 + 300;
    const timer = setTimeout(() => {
      setShowAccessOverlay(true);
    }, totalDelay);

    return () => clearTimeout(timer);
  }, [terminals, phase]);

  // Go to game after overlay appears
  useEffect(() => {
    if (!showAccessOverlay) return;

    const timer = setTimeout(() => {
      setPhase('game');
    }, 1500);

    return () => clearTimeout(timer);
  }, [showAccessOverlay]);

  if (phase === 'game') {
    return <Game />;
  }

  return (
    <div className="home-screen">
      {/* Terminal windows - always visible during terminals phase */}
      {phase === 'terminals' && (
        <>
          <div className="terminals-container">
            {terminals.map((terminal) => (
              <div
                key={terminal.id}
                className={`terminal-window ${visibleTerminals.includes(terminal.id) ? 'visible' : ''}`}
                style={{
                  top: terminal.position.top,
                  left: terminal.position.left,
                  zIndex: terminal.id + 1,
                }}
              >
                <div className="terminal-header-bar">
                  <span className="terminal-dot red"></span>
                  <span className="terminal-dot yellow"></span>
                  <span className="terminal-dot green"></span>
                  <span className="terminal-title">terminal_{terminal.id + 1}</span>
                </div>
                <div className="terminal-content">
                  {terminal.lines.map((line, lineIndex) => (
                    <div
                      key={lineIndex}
                      className="terminal-line"
                      style={{ animationDelay: `${terminal.delay + lineIndex * 10}ms` }}
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Access overlay on top of terminals */}
          {showAccessOverlay && (
            <div className="countdown-overlay">
              <div className="home-container">
                <h1 className="home-title">ACCÈS AUTORISÉ</h1>
                <div className="home-status">
                  <span className="status-icon">&#10003;</span>
                  AUTHENTIFICATION RÉUSSIE
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
