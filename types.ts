
export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'UPGRADE' | 'RELIC_SELECT';

export interface Entity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  markedForDeletion: boolean;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  isCrit: boolean;
  markedForDeletion: boolean;
}

export interface CoreStats {
  hp: number;
  maxHp: number;
  atk: number;
  fireRate: number;
  projSpeed: number;
  critRate: number;
  critDmg: number;
  luck: number;
  xpMult: number;
  missileCd: number;
  pickupRange: number; // New: Magnet range
}

export interface Enemy extends Entity {
  type: 'normal' | 'fast' | 'tank' | 'splitter' | 'splitter_mini' | 'summoner' | 'healer' | 'boss' | 'swarm';
  hp: number;
  maxHp: number;
  speed: number;
  freezeTimer: number;
  shield: number;
  hitFlash: number;
  bossTier?: number;
  timer: number; // Skill cooldown
  maxTimer: number;
  pushX: number;
  pushY: number;
}

export interface Projectile extends Entity {
  angle: number;
  life: number;
  tags: string[];
  pierce: number;
  isHoming: boolean;
  hasSplit: boolean;
}

export interface Particle extends Entity {
  life: number;
  maxLife: number;
}

export interface XPOrb extends Entity {
  value: number;
}

export interface Chest extends Entity {
  relicId?: string; // Optional pre-determined relic
}

export interface Upgrade {
  id: string;
  name: string;
  desc: string;
  icon: string;
  rarity: 1 | 2 | 3 | 4; 
  type: 'stat' | 'tag' | 'relic';
  apply?: (stats: CoreStats) => void;
}

export interface RelicDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  apply: (stats: CoreStats) => void;
}

export interface MetaData {
  tp: number;
  bestScore: number;
  upgrades: {
    hp: number;
    atk: number;
    xp: number;
    crit: number;
    cdmg: number;
    luck: number;
  };
}

export interface SyncData {
  hp: number;
  maxHp: number;
  score: number;
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
}