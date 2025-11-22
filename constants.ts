
import { Upgrade, RelicDef } from './types';

export const COLORS = {
  bg: '#f0f2f5',
  core: '#3b82f6',
  coreDark: '#1d4ed8',
  proj: '#22d3ee', // Bright Cyan
  enemy: '#ef4444',
  tank: '#f59e0b',
  fast: '#8b5cf6',
  splitter: '#ec4899',
  summoner: '#10b981',
  healer: '#06b6d4',
  swarm: '#d946ef', // Magenta for swarm
  boss: '#fbbf24',
  xp: '#22c55e',
  chest: '#facc15', // Gold
  obstacle: '#94a3b8',
  obstacleDark: '#64748b',
};

export const RARITY_COLORS = {
  1: 'border-slate-300 bg-gradient-to-br from-white to-slate-100',
  2: 'border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100',
  3: 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 shadow-[0_0_15px_rgba(168,85,247,0.3)]',
  4: 'border-amber-400 bg-gradient-to-br from-amber-50 to-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-pulse-glow',
};

export const TAGS: Record<string, Upgrade> = {
  SPLIT: { id: 'SPLIT', name: 'Multishot', desc: 'Fire +2 bullets', icon: '🔱', rarity: 2, type: 'tag' },
  PIERCE: { id: 'PIERCE', name: 'Piercing', desc: 'Bullets penetrate enemies', icon: '🏹', rarity: 2, type: 'tag' },
  GIANT: { id: 'GIANT', name: 'Giant', desc: 'Larger bullets, more dmg', icon: '🐘', rarity: 3, type: 'tag' },
  DOUBLE: { id: 'DOUBLE', name: 'Double Barrel', desc: 'Fire 2 at once', icon: '🍒', rarity: 3, type: 'tag' },
  REAR: { id: 'REAR', name: 'Rear Shot', desc: 'Shoot backwards', icon: '🔙', rarity: 2, type: 'tag' },
  ORBIT: { id: 'ORBIT', name: 'Shield Bot', desc: 'Orbital guard', icon: '🛡️', rarity: 4, type: 'tag' },
  VAMP: { id: 'VAMP', name: 'Leech', desc: 'Heal on kill', icon: '🩸', rarity: 4, type: 'tag' },
  KNOCK: { id: 'KNOCK', name: 'Pushback', desc: 'Knock enemies back', icon: '🥊', rarity: 2, type: 'tag' },
  HOMING: { id: 'HOMING', name: 'Missile', desc: 'Periodic homing missile', icon: '🚀', rarity: 4, type: 'tag' },
  BLAST: { id: 'BLAST', name: 'Explosive', desc: 'Area damage on hit', icon: '💥', rarity: 3, type: 'tag' },
  CHAIN: { id: 'CHAIN', name: 'Lightning', desc: 'Chain damage', icon: '⚡', rarity: 3, type: 'tag' },
  FREEZE: { id: 'FREEZE', name: 'Ice', desc: 'Slow enemies', icon: '❄️', rarity: 2, type: 'tag' },
  LUCKY: { id: 'LUCKY', name: 'Lucky', desc: 'Better drops', icon: '🍀', rarity: 4, type: 'tag' },
};

export const SYNERGIES = {
  OMNI: { name: 'THE OMNISCIENT', desc: 'Auto-Aim + 360 Attack', req: ['HOMING', 'REAR'], icon: '👁️' },
  BLOOD: { name: 'BLOOD LORD', desc: 'Kills increase Damage', req: ['VAMP', 'GIANT'], icon: '🩸' },
  FROST: { name: 'ABSOLUTE ZERO', desc: 'Freeze Nova on Kill', req: ['FREEZE', 'BLAST'], icon: '❄️' },
  THOR: { name: 'THUNDER GOD', desc: 'Super Chain Lightning', req: ['CHAIN', 'DOUBLE'], icon: '⚡' },
};

export const RELICS: RelicDef[] = [
  { id: 'R_VAMP', name: 'Vampire Tooth', desc: 'Heal +2 HP on kill (10% chance)', icon: '🧛', apply: (s) => {} }, // Logic handled in engine
  { id: 'R_ENGINE', name: 'Turbo Engine', desc: 'Fire Rate +20%', icon: '🏎️', apply: (s) => s.fireRate = Math.max(2, s.fireRate * 0.8) },
  { id: 'R_SCOPE', name: 'Sniper Scope', desc: 'Crit Rate +10%', icon: '🔭', apply: (s) => s.critRate += 0.10 },
  { id: 'R_MAGNET', name: 'Super Magnet', desc: 'Pickup Range +50%', icon: '🧲', apply: (s) => s.pickupRange += 50 },
  { id: 'R_ARMOR', name: 'Iron Plating', desc: 'Max HP +50', icon: '🛡️', apply: (s) => { s.maxHp += 50; s.hp += 50; } },
  { id: 'R_AMMO', name: 'Heavy Ammo', desc: 'Damage +20%', icon: '💣', apply: (s) => s.atk *= 1.2 },
];

export const META_SHOP_CONFIG: Record<string, { base: number; s: number; b: number; name: string; icon: string }> = {
  hp: { base: 100, s: 1.5, b: 20, name: 'Hull Integrity', icon: '🛡️' },
  atk: { base: 150, s: 1.5, b: 2, name: 'Core Power', icon: '⚔️' },
  xp: { base: 200, s: 1.6, b: 0.1, name: 'Data Mining', icon: '🧠' },
  crit: { base: 200, s: 1.6, b: 0.02, name: 'Precision', icon: '🎯' },
  cdmg: { base: 150, s: 1.5, b: 0.2, name: 'Overcharge', icon: '💥' },
  luck: { base: 300, s: 1.7, b: 0.1, name: 'Entropy', icon: '🍀' },
};