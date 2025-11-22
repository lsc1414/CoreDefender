import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './services/gameEngine';
import { UIOverlay } from './components/UIOverlay';
import { GameState, Upgrade, CoreStats, MetaData, SyncData } from './types';
import { TAGS, META_SHOP_CONFIG } from './constants';

const DEFAULT_META: MetaData = {
  tp: 0,
  bestScore: 0,
  upgrades: { hp: 0, atk: 0, xp: 0, crit: 0, cdmg: 0, luck: 0 }
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  
  // Game State
  const [gameState, setGameState] = useState<GameState>('MENU');
  const gameStateRef = useRef<GameState>('MENU');
  const [debugMode, setDebugMode] = useState(false);

  // Pending Relic
  const [foundRelicId, setFoundRelicId] = useState<string | undefined>(undefined);

  const [uiStats, setUiStats] = useState<SyncData>({
    hp: 100, maxHp: 100, score: 0, xp: 0, nextXp: 100, level: 1, 
    ultCharge: 0, ultMax: 100, ultActive: false, time: 0, tags: [], relics: [], fps: 0
  });
  
  // Meta State
  const [metaData, setMetaData] = useState<MetaData>(() => {
    try {
      const saved = localStorage.getItem('cd_react_meta');
      return saved ? JSON.parse(saved) : DEFAULT_META;
    } catch (e) {
      return DEFAULT_META;
    }
  });

  // Upgrade State
  const [upgradeOptions, setUpgradeOptions] = useState<Upgrade[]>([]);

  // Sync ref for loop access
  useEffect(() => {
    gameStateRef.current = gameState;
    localStorage.setItem('cd_react_meta', JSON.stringify(metaData));
  }, [gameState, metaData]);

  // Keyboard Controls (Pause, Debug)
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'F3') {
              e.preventDefault();
              setDebugMode(prev => !prev);
          }
          if (e.key === 'Escape') {
              if (gameStateRef.current === 'PLAYING') {
                  setGameState('PAUSED');
                  engineRef.current?.pause();
              } else if (gameStateRef.current === 'PAUSED') {
                  setGameState('PLAYING');
                  engineRef.current?.resume();
              }
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const generateUpgrades = () => {
    const choices: Upgrade[] = [];
    // Safe access if engine not ready
    const currentTags = engineRef.current?.core.tags || [];
    const availableTags = Object.values(TAGS).filter(t => !currentTags.includes(t.id));
    
    const rollRarity = () => {
        const r = Math.random();
        if (r < 0.6) return 1;
        if (r < 0.85) return 2;
        if (r < 0.95) return 3;
        return 4;
    };

    const statUpgrades: Upgrade[] = [
        { id: 'DMG', name: 'Damage Up', desc: 'Attack +15%', icon: '⚔️', rarity: 1, type: 'stat', apply: (s) => s.atk *= 1.15 },
        { id: 'SPD', name: 'Rapid Fire', desc: 'Fire Rate +10%', icon: '⏩', rarity: 1, type: 'stat', apply: (s) => s.fireRate = Math.max(2, s.fireRate * 0.9) },
        { id: 'HP', name: 'Repair', desc: 'Heal 30% HP', icon: '❤️', rarity: 1, type: 'stat', apply: (s) => s.hp = Math.min(s.maxHp, s.hp + s.maxHp * 0.3) },
        { id: 'CRIT', name: 'Critical', desc: 'Crit Rate +5%', icon: '🎯', rarity: 2, type: 'stat', apply: (s) => s.critRate += 0.05 },
    ];

    while (choices.length < 3) {
        const targetRarity = rollRarity();
        const tagCandidates = availableTags.filter(t => t.rarity === targetRarity);
        
        if (targetRarity > 1 && tagCandidates.length > 0 && Math.random() > 0.3) {
            const tag = tagCandidates[Math.floor(Math.random() * tagCandidates.length)];
            if (!choices.find(c => c.id === tag.id)) choices.push(tag);
        } else {
            const stat = statUpgrades[Math.floor(Math.random() * statUpgrades.length)];
            choices.push({ ...stat, rarity: targetRarity as any }); 
        }
        
        // Remove duplicates
        const ids = new Set();
        const unique: Upgrade[] = [];
        for (const c of choices) {
            if (!ids.has(c.id)) {
                ids.add(c.id);
                unique.push(c);
            }
        }
        
        if (unique.length < choices.length) {
            choices.length = 0; // Reset and retry if dupes found
            choices.push(...unique);
        }
    }
    return choices;
  };

  // Initialize Engine ONCE
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const engine = new GameEngine(canvasRef.current, {
        onGameOver: (finalScore: number) => {
            setGameState('GAME_OVER');
            setMetaData(prev => ({
                ...prev,
                tp: prev.tp + Math.floor(finalScore * 0.2),
                bestScore: Math.max(prev.bestScore, finalScore)
            }));
        },
        onUpgrade: () => {
            engineRef.current?.pause();
            setGameState('UPGRADE');
        },
        onRelicFound: (relicId: string) => {
            engineRef.current?.pause();
            setFoundRelicId(relicId);
            setGameState('RELIC_SELECT');
        },
        onSynergy: (name: string) => {
            console.log("Synergy:", name);
        },
        onSyncUI: (stats: SyncData) => {
            setUiStats(stats);
        }
    });

    engineRef.current = engine;

    const loop = () => {
        requestAnimationFrame(loop);
        
        // Always run loop method, engine handles pausing internally for delta time logic
        engine.loop();
    };
    const handle = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(handle);
  }, []);

  // Effect to handle upgrade generation when state switches
  useEffect(() => {
    if (gameState === 'UPGRADE') {
        setUpgradeOptions(generateUpgrades());
    }
  }, [gameState]);

  const handleStart = () => {
    if (!engineRef.current) return;
    // Calculate stats based on meta
    const bonuses: Partial<CoreStats> = {};
    bonuses.maxHp = 100 + (metaData.upgrades.hp * META_SHOP_CONFIG.hp.b);
    bonuses.atk = 10 + (metaData.upgrades.atk * META_SHOP_CONFIG.atk.b);
    bonuses.xpMult = 1 + (metaData.upgrades.xp * META_SHOP_CONFIG.xp.b);
    bonuses.critRate = 0.05 + (metaData.upgrades.crit * META_SHOP_CONFIG.crit.b);
    bonuses.critDmg = 1.5 + (metaData.upgrades.cdmg * META_SHOP_CONFIG.cdmg.b);
    bonuses.luck = 1.0 + (metaData.upgrades.luck * META_SHOP_CONFIG.luck.b);

    engineRef.current.start(bonuses);
    setGameState('PLAYING');
  };

  const handleBuyUpgrade = (key: string) => {
    const cfg = META_SHOP_CONFIG[key];
    // @ts-ignore
    const lvl = metaData.upgrades[key] || 0;
    const cost = Math.floor(cfg.base * Math.pow(cfg.s, lvl));
    
    if (metaData.tp >= cost) {
        setMetaData(prev => ({
            ...prev,
            tp: prev.tp - cost,
            upgrades: { ...prev.upgrades, [key]: lvl + 1 }
        }));
    }
  };

  const handleSelectUpgrade = (u: Upgrade) => {
    if (!engineRef.current) return;
    
    if (u.type === 'tag') {
        engineRef.current.core.tags.push(u.id);
        if (u.id === 'ORBIT') engineRef.current.addOrbital();
        if (u.id === 'LUCKY') engineRef.current.stats.luck += 0.5;
    } else if (u.apply) {
        u.apply(engineRef.current.stats);
    }
    
    engineRef.current.resume();
    setGameState('PLAYING');
  };

  const handleConfirmRelic = () => {
      if (foundRelicId && engineRef.current) {
          engineRef.current.applyRelic(foundRelicId);
          engineRef.current.resume();
          setGameState('PLAYING');
          setFoundRelicId(undefined);
      }
  };

  const handleTogglePause = () => {
      if (gameState === 'PLAYING') {
          engineRef.current?.pause();
          setGameState('PAUSED');
      } else if (gameState === 'PAUSED') {
          engineRef.current?.resume();
          setGameState('PLAYING');
      }
  };

  return (
    <div className="w-full h-screen bg-slate-900 overflow-hidden relative">
      <canvas ref={canvasRef} className="block absolute top-0 left-0 z-0" />
      
      <UIOverlay 
        gameState={gameState}
        {...uiStats}
        stats={engineRef.current?.stats || {} as any}
        metaData={metaData}
        currentUpgrades={upgradeOptions}
        onStart={handleStart}
        onBuyUpgrade={handleBuyUpgrade}
        onSelectUpgrade={handleSelectUpgrade}
        onUseUlt={() => engineRef.current?.activateUlt()}
        onReset={() => setGameState('MENU')}
        onResume={handleTogglePause}
        onConfirmRelic={handleConfirmRelic}
        debugMode={debugMode}
        relicFoundId={foundRelicId}
      />
    </div>
  );
}