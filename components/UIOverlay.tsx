
import React, { useState } from 'react';
import { Upgrade, CoreStats, MetaData } from '../types';
import { TAGS, RELICS, META_SHOP_CONFIG, RARITY_COLORS } from '../constants';

interface UIProps {
  gameState: string;
  score: number;
  stats: CoreStats;
  hp: number;
  maxHp: number;
  xp: number;
  nextXp: number;
  level: number;
  ultCharge: number;
  ultMax: number;
  ultActive: boolean;
  time: number;
  tags: string[];
  relics: string[];
  fps: number;
  metaData: MetaData;
  currentUpgrades: Upgrade[];
  onStart: () => void;
  onBuyUpgrade: (key: string) => void;
  onSelectUpgrade: (u: Upgrade) => void;
  onUseUlt: () => void;
  onReset: () => void;
  onResume: () => void;
  onConfirmRelic: () => void;
  debugMode: boolean;
  relicFoundId?: string;
}

export const UIOverlay: React.FC<UIProps> = ({
  gameState, score, stats, hp, maxHp, xp, nextXp, level, ultCharge, ultMax, ultActive, time, tags, relics, fps,
  metaData, currentUpgrades, onStart, onBuyUpgrade, onSelectUpgrade, onUseUlt, onReset, onResume, onConfirmRelic, debugMode, relicFoundId
}) => {
  
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const foundRelicDef = relicFoundId ? RELICS.find(r => r.id === relicFoundId) : null;

  if (gameState === 'MENU') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white z-50">
        <h1 className="text-7xl font-black mb-2 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400" style={{filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))'}}>CORE DEFENDER</h1>
        <div className="text-sm font-bold text-slate-400 mb-8 tracking-widest">REACT EDITION</div>

        <div className="flex items-center gap-4 mb-8 bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
            <div className="flex flex-col items-center">
                <span className="text-yellow-400 font-black text-xl">TP</span>
                <span className="text-xs text-slate-500">POINTS</span>
            </div>
            <div className="w-px h-8 bg-slate-600"></div>
            <span className="text-4xl font-black">{metaData.tp}</span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-10">
            {Object.entries(META_SHOP_CONFIG).map(([key, cfg]) => {
                // @ts-ignore
                const lvl = metaData.upgrades[key] || 0;
                const cost = Math.floor(cfg.base * Math.pow(cfg.s, lvl));
                const canAfford = metaData.tp >= cost;
                
                return (
                    <button 
                        key={key}
                        onClick={() => onBuyUpgrade(key)}
                        disabled={!canAfford}
                        className={`p-4 rounded-xl border transition-all flex flex-col items-center w-32
                            ${canAfford 
                                ? 'bg-slate-800 border-slate-600 hover:bg-slate-700 hover:border-blue-500' 
                                : 'bg-slate-900/50 border-slate-800 opacity-50 cursor-not-allowed'}`}
                    >
                        <div className="text-2xl mb-1">{cfg.icon}</div>
                        <div className="text-xs font-bold text-slate-300">{cfg.name}</div>
                        <div className="text-blue-400 font-black text-lg">Lvl {lvl}</div>
                        <div className="text-xs text-yellow-500 mt-1">{cost} TP</div>
                    </button>
                );
            })}
        </div>

        <button 
            onClick={onStart}
            className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-4 rounded-full text-2xl font-black shadow-lg shadow-blue-900/50 transition-transform active:scale-95 border-b-4 border-blue-800"
        >
            DEPLOY CORE
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-40">
      {/* DEBUG OVERLAY */}
      {debugMode && (
          <div className="absolute top-20 left-4 bg-black/50 p-2 text-[10px] font-mono text-green-400 rounded pointer-events-auto">
              <div>Entities: {1 + tags.length}</div>
              <div>State: {gameState}</div>
              <div>Time: {time}s</div>
              <div>X: {Math.round(stats.fireRate)} | S: {stats.projSpeed}</div>
          </div>
      )}

      {/* HUD TOP */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start">
         {/* Health & XP */}
         <div className="glass-panel rounded-full px-6 py-2 flex flex-col w-80 shadow-lg">
            <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                <div className="flex gap-4">
                  <span>LVL <span className="text-slate-800 text-lg">{level}</span></span>
                  <span className="text-slate-400 mt-1">{fps} FPS</span>
                </div>
                <span>{formatTime(time)}</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full transition-all duration-300" style={{width: `${(xp/nextXp)*100}%`}}></div>
            </div>
         </div>

         {/* Score & Pause Button */}
         <div className="text-right flex gap-4">
             <div>
                <div className="text-4xl font-black text-white drop-shadow-lg">{score.toLocaleString()}</div>
                <div className="text-red-400 font-bold drop-shadow-md text-xl">HP {Math.ceil(hp)} / {maxHp}</div>
             </div>
             <button onClick={onResume} className="pointer-events-auto bg-white/20 hover:bg-white/40 p-2 rounded text-white backdrop-blur h-fit self-center">
                 ⏸
             </button>
         </div>
      </div>

      {/* SIDEBAR: SKILLS / RELICS */}
      <div className="absolute top-24 right-4 flex flex-col gap-2 items-end w-48 max-h-[80vh] overflow-y-auto no-scrollbar">
        {/* Tags */}
        {tags.length > 0 && (
            <div className="flex flex-col gap-1 items-end mb-4">
                <div className="text-xs font-black text-white/50 uppercase tracking-widest border-b border-white/20 w-full text-right pb-1 mb-1">Systems</div>
                {tags.map((tagId, idx) => {
                    const tagInfo = TAGS[tagId];
                    if(!tagInfo) return null;
                    return (
                        <div key={idx} className={`bg-white/90 backdrop-blur p-1 pr-2 rounded-l-xl flex items-center gap-2 border-r-4 shadow-md animate-pop ${
                            tagInfo.rarity === 4 ? 'border-amber-400' : 
                            tagInfo.rarity === 3 ? 'border-purple-500' : 
                            tagInfo.rarity === 2 ? 'border-blue-400' : 'border-slate-300'
                        }`}>
                            <div className="text-xl">{tagInfo.icon}</div>
                            <div className="text-right">
                                <div className="font-black text-[10px] text-slate-800 leading-none">{tagInfo.name}</div>
                            </div>
                        </div>
                    )
                })}
            </div>
        )}
        
        {/* Relics */}
        {relics.length > 0 && (
            <div className="flex flex-col gap-1 items-end">
                <div className="text-xs font-black text-yellow-400/50 uppercase tracking-widest border-b border-yellow-400/20 w-full text-right pb-1 mb-1">Relics</div>
                <div className="flex flex-wrap justify-end gap-1">
                    {relics.map((relId, idx) => {
                        const relInfo = RELICS.find(r => r.id === relId);
                        if(!relInfo) return null;
                        return (
                            <div key={idx} className="bg-slate-800 p-1.5 rounded-lg border border-yellow-500 text-lg shadow-sm" title={relInfo.name}>
                                {relInfo.icon}
                            </div>
                        )
                    })}
                </div>
            </div>
        )}
      </div>

      {/* ULT BUTTON */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center gap-2">
        <div className="w-48 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-400 transition-all duration-100" style={{width: `${(ultCharge/ultMax)*100}%`}}></div>
        </div>
        <button 
            onClick={onUseUlt}
            disabled={ultCharge < ultMax && !ultActive}
            className={`px-8 py-3 rounded-xl font-black tracking-widest text-lg border-b-4 transition-all shadow-lg
                ${ultActive 
                    ? 'bg-red-500 border-red-700 text-white animate-pulse' 
                    : (ultCharge >= ultMax 
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 border-orange-700 text-white animate-bounce' 
                        : 'bg-slate-700 border-slate-900 text-slate-500 grayscale')}
            `}
        >
            {ultActive ? 'OVERLOADED!' : 'OVERLOAD'}
        </button>
      </div>

      {/* MODALS */}
      
      {/* PAUSE MENU */}
      {gameState === 'PAUSED' && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur flex items-center justify-center pointer-events-auto z-50">
              <div className="bg-slate-800 p-8 rounded-2xl text-center border border-slate-600 shadow-2xl">
                  <h2 className="text-4xl font-black text-white mb-8">PAUSED</h2>
                  <div className="flex flex-col gap-4">
                      <button onClick={onResume} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-bold">RESUME</button>
                      <button onClick={onReset} className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-lg font-bold">QUIT</button>
                  </div>
              </div>
          </div>
      )}

      {/* UPGRADE MODAL */}
      {gameState === 'UPGRADE' && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center pointer-events-auto z-50">
              <div className="bg-white p-8 rounded-3xl max-w-2xl w-full shadow-2xl animate-pop">
                  <h2 className="text-3xl font-black text-slate-800 text-center mb-8">SYSTEM UPGRADE</h2>
                  <div className="grid grid-cols-1 gap-4">
                      {currentUpgrades.map((u, i) => (
                          <div 
                            key={i} 
                            onClick={() => onSelectUpgrade(u)}
                            className={`p-4 rounded-2xl border-2 flex items-center gap-4 cursor-pointer hover:scale-105 transition-transform bg-white ${RARITY_COLORS[u.rarity]}`}
                          >
                              <div className="text-4xl bg-white/50 w-16 h-16 flex items-center justify-center rounded-xl">{u.icon}</div>
                              <div className="flex-1 text-slate-800">
                                  <div className="flex justify-between items-center">
                                      <h3 className="font-black text-xl">{u.name}</h3>
                                      <span className="text-[10px] font-bold uppercase px-2 py-1 bg-white/80 rounded text-slate-600">
                                        {u.rarity === 1 ? 'Common' : u.rarity === 2 ? 'Rare' : u.rarity === 3 ? 'Epic' : 'Legendary'}
                                      </span>
                                  </div>
                                  <p className="font-bold text-slate-600/80 text-sm">{u.desc}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* RELIC MODAL */}
      {gameState === 'RELIC_SELECT' && foundRelicDef && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto z-50">
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-1 rounded-3xl shadow-2xl animate-pop border border-yellow-500/50">
                  <div className="bg-slate-900 p-8 rounded-[20px] text-center max-w-md w-full">
                    <div className="text-yellow-400 font-bold tracking-widest text-sm mb-2">RARE ARTIFACT FOUND</div>
                    <div className="text-6xl mb-4 animate-bounce">{foundRelicDef.icon}</div>
                    <h2 className="text-3xl font-black text-white mb-2">{foundRelicDef.name}</h2>
                    <p className="text-slate-400 font-bold mb-8">{foundRelicDef.desc}</p>
                    
                    <button 
                        onClick={onConfirmRelic}
                        className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 w-full py-4 rounded-xl font-black text-xl shadow-lg shadow-yellow-500/20"
                    >
                        EQUIP RELIC
                    </button>
                  </div>
              </div>
          </div>
      )}

      {/* GAME OVER */}
      {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center pointer-events-auto z-50">
              <div className="text-center animate-pop">
                  <h2 className="text-6xl font-black text-white mb-2 tracking-tighter">CRITICAL FAILURE</h2>
                  <p className="text-slate-400 font-bold mb-8">CORE DESTROYED</p>
                  
                  <div className="bg-white/10 p-6 rounded-2xl backdrop-blur mb-8 border border-white/10">
                      <div className="text-sm text-slate-400 uppercase tracking-widest mb-1">Final Score</div>
                      <div className="text-5xl font-black text-white mb-4">{score.toLocaleString()}</div>
                      <div className="flex justify-center gap-8">
                        <div>
                            <div className="text-xs text-slate-400">TIME ALIVE</div>
                            <div className="font-bold">{formatTime(time)}</div>
                        </div>
                        <div>
                            <div className="text-xs text-slate-400">TECH POINTS</div>
                            <div className="font-bold text-yellow-400">+{Math.floor(score * 0.2)} TP</div>
                        </div>
                      </div>
                  </div>

                  <button 
                    onClick={onReset}
                    className="bg-white text-slate-900 px-10 py-4 rounded-full font-black text-xl hover:scale-105 transition-transform"
                  >
                      REBOOT SYSTEM
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};
