
import { COLORS, TAGS, SYNERGIES, RELICS } from '../constants';
import { Enemy, Projectile, Particle, XPOrb, Chest, CoreStats, Entity, FloatingText, SyncData } from '../types';
import { sfx } from './audio';

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  
  // Game State
  width: number = 0;
  height: number = 0;
  frames: number = 0;
  time: number = 0;
  score: number = 0;
  difficulty: number = 1;
  shake: number = 0;
  paused: boolean = false;
  isGameOver: boolean = false;
  bossCount: number = 0;

  // Debug
  lastTime: number = 0;
  fps: number = 60;
  
  // Core
  core = { x: 0, y: 0, angle: 0, level: 1, xp: 0, nextXp: 20, tags: [] as string[], relics: [] as string[] };
  orbitals: { angle: number, radius: number }[] = [];
  
  stats: CoreStats = { hp: 100, maxHp: 100, atk: 10, fireRate: 15, projSpeed: 8, critRate: 0.05, critDmg: 1.5, luck: 1, xpMult: 1, missileCd: 120, pickupRange: 100 };
  
  // Ult
  ult = { active: false, charge: 0, maxCharge: 100, timer: 0 };
  
  // Entities
  enemies: Enemy[] = [];
  projectiles: Projectile[] = [];
  particles: Particle[] = [];
  xpOrbs: XPOrb[] = [];
  chests: Chest[] = [];
  floatingTexts: FloatingText[] = [];
  beams: { x1: number, y1: number, x2: number, y2: number, life: number, color: string, points: {x:number, y:number}[] }[] = [];

  // Input
  mouse = { x: 0, y: 0 };
  
  // Callbacks
  onGameOver: (score: number) => void;
  onUpgrade: () => void;
  onRelicFound: (relicId: string) => void;
  onSynergy: (name: string, desc: string) => void;
  onSyncUI: (data: SyncData) => void;

  constructor(canvas: HTMLCanvasElement, callbacks: any) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onGameOver = callbacks.onGameOver;
    this.onUpgrade = callbacks.onUpgrade;
    this.onRelicFound = callbacks.onRelicFound;
    this.onSynergy = callbacks.onSynergy;
    this.onSyncUI = callbacks.onSyncUI;
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    canvas.addEventListener('mousemove', (e) => this.updateInput(e.clientX, e.clientY));
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this.updateInput(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.core.x = this.width / 2;
    this.core.y = this.height / 2;
  }

  updateInput(x: number, y: number) {
    if (this.paused || this.isGameOver) return;
    this.mouse.x = x;
    this.mouse.y = y;
    const dx = x - this.core.x;
    const dy = y - this.core.y;
    if (!this.core.tags.includes('OMNI')) {
        this.core.angle = Math.atan2(dy, dx);
    }
  }

  start(metaStats: Partial<CoreStats>) {
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];
    this.xpOrbs = [];
    this.chests = [];
    this.floatingTexts = [];
    this.beams = [];
    this.core.tags = [];
    this.core.relics = [];
    this.orbitals = [];
    this.core.level = 1;
    this.core.xp = 0;
    this.core.nextXp = 20;
    this.frames = 0;
    this.time = 0;
    this.score = 0;
    this.difficulty = 1;
    this.bossCount = 0;
    this.ult = { active: false, charge: 0, maxCharge: 100, timer: 0 };
    this.paused = false;
    this.isGameOver = false;

    this.stats = { ...this.stats, ...metaStats };
    this.stats.hp = this.stats.maxHp;
    
    sfx.init();
  }

  pause() { this.paused = true; }
  resume() { this.paused = false; this.lastTime = performance.now(); }
  
  activateUlt() {
    if (this.ult.charge >= this.ult.maxCharge && !this.ult.active) {
        this.ult.active = true;
        this.ult.timer = 300; 
        this.ult.charge = 0;
        this.shake = 20;
        this.explosion(this.core.x, this.core.y, '#fff', 20);
        sfx.explosion();
    }
  }

  addOrbital() {
      this.orbitals.push({ angle: (Math.PI * 2 / (this.orbitals.length + 1)) * this.orbitals.length, radius: 60 });
      this.orbitals.forEach((o, i) => {
          o.angle = (Math.PI * 2 / this.orbitals.length) * i;
      });
  }

  applyRelic(relicId: string) {
      const r = RELICS.find(rel => rel.id === relicId);
      if (r) {
          r.apply(this.stats);
          this.core.relics.push(relicId);
          sfx.chest();
          if (relicId === 'R_VAMP' || relicId === 'R_ARMOR') {
              this.addFloatingText(this.core.x, this.core.y, "UPGRADE!", "#facc15", 20);
          }
      }
  }

  loop() {
    const now = performance.now();
    const delta = now - this.lastTime;
    if (delta >= 1000) {
        this.fps = Math.round((1000 / delta) * 60) || 60;
        this.lastTime = now;
    }

    if (!this.paused && !this.isGameOver) {
        this.frames++;
        this.update();
    }
    this.draw();
    
    if (this.frames % 5 === 0 || this.isGameOver) {
        this.onSyncUI({
            hp: Math.max(0, this.stats.hp),
            maxHp: this.stats.maxHp,
            score: this.score,
            xp: this.core.xp,
            nextXp: this.core.nextXp,
            level: this.core.level,
            ultCharge: this.ult.charge,
            ultMax: this.ult.maxCharge,
            ultActive: this.ult.active,
            time: this.time,
            tags: this.core.tags,
            relics: this.core.relics,
            fps: this.fps
        });
    }
  }

  update() {
    // CRITICAL: Stop update if game over
    if (this.isGameOver || this.stats.hp <= 0) {
        this.isGameOver = true;
        return; 
    }

    if (this.frames % 60 === 0) {
        this.time++;
        this.difficulty = 1.0 + (this.time / 45) * 0.5;
    }

    if (this.ult.active) {
        this.ult.timer--;
        if (this.ult.timer <= 0) this.ult.active = false;
        if (this.frames % 5 === 0) this.shake = 5;
    }

    let spawnRate = Math.max(20, 100 - this.difficulty * 10);
    if (this.frames % Math.floor(spawnRate) === 0) {
        this.spawnEnemy();
    }

    let currentFireRate = this.ult.active ? 4 : this.stats.fireRate;
    if (this.core.tags.includes('OMNI')) currentFireRate *= 0.8;
    
    if (this.frames % Math.floor(currentFireRate) === 0) {
        if (this.core.tags.includes('OMNI')) {
            const target = this.getNearestEnemy(this.core.x, this.core.y);
            if (target) {
                this.core.angle = Math.atan2(target.y - this.core.y, target.x - this.core.x);
            } else {
                this.core.angle += 0.1; 
            }
        }
        this.shoot();
    }

    if (this.core.tags.includes('HOMING') && this.frames % this.stats.missileCd === 0) {
        this.shootMissile();
    }

    this.updateEnemies();
    this.updateProjectiles();
    this.updateParticles();
    this.updateXP();
    this.updateChests();
    this.updateOrbitals();
    this.updateBeams();
    this.updateFloatingTexts();
  }

  spawnEnemy() {
    const typeRoll = Math.random();
    let type: Enemy['type'] = 'normal';
    
    // Boss Logic: Spawn boss every 60 seconds
    if (this.time > 0 && this.time % 60 === 0 && this.enemies.filter(e => e.type === 'boss').length === 0) {
        type = 'boss';
        this.bossCount++;
    }
    else if (this.difficulty > 1.5 && typeRoll < 0.1) type = 'summoner';
    else if (this.difficulty > 1.5 && typeRoll < 0.2) type = 'healer';
    else if (this.difficulty > 1.2 && typeRoll < 0.3) type = 'splitter';
    else if (this.time > 30 && typeRoll < 0.05) type = 'swarm'; // New Swarm Type Chance
    else if (typeRoll < 0.1 * this.difficulty) type = 'tank';
    else if (typeRoll < 0.3 * this.difficulty) type = 'fast';

    const side = Math.floor(Math.random() * 4);
    let baseX = 0, baseY = 0;
    if (side === 0) { baseX = Math.random() * this.width; baseY = -50; } 
    else if (side === 1) { baseX = this.width + 50; baseY = Math.random() * this.height; } 
    else if (side === 2) { baseX = Math.random() * this.width; baseY = this.height + 50; } 
    else { baseX = -50; baseY = Math.random() * this.height; }

    const hpMult = this.difficulty;
    
    // Handle Swarm Batch Spawning
    if (type === 'swarm') {
        // Spawn 15-20 units
        const count = Math.floor(Math.random() * 8) + 12;
        for(let i=0; i<count; i++) {
            const offX = (Math.random() - 0.5) * 150;
            const offY = (Math.random() - 0.5) * 150;
            this.enemies.push({
                x: baseX + offX, y: baseY + offY, vx: 0, vy: 0, type: 'swarm', radius: 8, color: COLORS.swarm,
                hp: 4 * hpMult, maxHp: 4 * hpMult, speed: 2.2 * Math.min(2.5, 1 + this.difficulty * 0.1),
                freezeTimer: 0, shield: 0, hitFlash: 0, pushX: 0, pushY: 0, markedForDeletion: false,
                timer: 0, maxTimer: 0
            });
        }
        return; // Swarm spawns as a group, no single spawn below
    }

    // Standard Spawning for other types
    let stats = { hp: 10, spd: 1, r: 14, c: COLORS.enemy };
    
    if (type === 'boss') {
        stats = { hp: 300 + (this.bossCount * 100), spd: 0.3, r: 50, c: COLORS.boss };
    } else {
        switch(type) {
            case 'tank': stats = { hp: 30, spd: 0.6, r: 22, c: COLORS.tank }; break;
            case 'fast': stats = { hp: 6, spd: 1.8, r: 10, c: COLORS.fast }; break;
            case 'splitter': stats = { hp: 15, spd: 0.8, r: 18, c: COLORS.splitter }; break;
            case 'summoner': stats = { hp: 40, spd: 0.4, r: 24, c: COLORS.summoner }; break;
            case 'healer': stats = { hp: 20, spd: 0.7, r: 16, c: COLORS.healer }; break;
        }
    }

    this.enemies.push({
        x: baseX, y: baseY, vx: 0, vy: 0, type, radius: stats.r, color: stats.c,
        hp: stats.hp * hpMult, maxHp: stats.hp * hpMult, speed: stats.spd * Math.min(2.5, 1 + this.difficulty * 0.1),
        freezeTimer: 0, shield: 0, hitFlash: 0, pushX: 0, pushY: 0, markedForDeletion: false,
        bossTier: type === 'boss' ? ((this.bossCount - 1) % 3) + 1 : undefined,
        timer: 180, maxTimer: 180
    });
    
    if (type === 'boss') {
        this.addFloatingText(this.width/2, this.height/2 - 100, "BOSS DETECTED", COLORS.enemy, 40);
        sfx.gameOver(); 
    }
  }

  shoot() {
    sfx.shoot();
    const count = this.core.tags.includes('SPLIT') ? 3 : 1;
    
    const createProj = (angleOffset: number) => {
        this.projectiles.push({
            x: this.core.x, y: this.core.y,
            vx: Math.cos(this.core.angle + angleOffset) * this.stats.projSpeed,
            vy: Math.sin(this.core.angle + angleOffset) * this.stats.projSpeed,
            radius: this.core.tags.includes('GIANT') ? 8 : 4,
            color: COLORS.proj,
            angle: this.core.angle + angleOffset,
            life: 60, tags: [...this.core.tags],
            pierce: this.core.tags.includes('PIERCE') ? 2 : 0,
            isHoming: false, hasSplit: false, markedForDeletion: false
        });
    };

    if (count === 1) createProj(0);
    else { createProj(-0.2); createProj(0); createProj(0.2); }

    if (this.core.tags.includes('DOUBLE')) createProj(0.1); 
    if (this.core.tags.includes('REAR')) createProj(Math.PI);
  }

  shootMissile() {
    this.projectiles.push({
        x: this.core.x, y: this.core.y,
        vx: Math.cos(this.core.angle) * this.stats.projSpeed * 0.5,
        vy: Math.sin(this.core.angle) * this.stats.projSpeed * 0.5,
        radius: 6, color: COLORS.healer, angle: this.core.angle,
        life: 150, tags: ['HOMING', 'BLAST'], pierce: 0, isHoming: true, hasSplit: false, markedForDeletion: false
    });
    sfx.shoot();
  }

  updateEnemies() {
    this.enemies.forEach(e => {
        // --- BOSS SKILLS ---
        if (e.type === 'boss' && e.bossTier) {
            e.timer--;
            if (e.timer <= 0) {
                // Reset timer
                e.timer = 300; // 5 seconds base
                this.addFloatingText(e.x, e.y - 60, "WARNING!", COLORS.enemy, 24);
                
                // Tier 1: Guardian (Shield + Tank Spawn)
                if (e.bossTier === 1) {
                    e.shield = 200;
                    this.addFloatingText(e.x, e.y, "SHIELD UP", COLORS.tank, 20);
                    for(let i=0; i<2; i++) {
                        this.enemies.push({
                            x: e.x + (Math.random()-0.5)*50, y: e.y + (Math.random()-0.5)*50, vx:0, vy:0, type:'tank', radius:22, color:COLORS.tank,
                            hp: 50 * this.difficulty, maxHp: 50 * this.difficulty, speed: 1, freezeTimer: 0, shield: 0, hitFlash: 0, pushX:0, pushY:0, markedForDeletion: false, timer:0, maxTimer:0
                        });
                    }
                    sfx.levelUp();
                }
                // Tier 2: Prism (Radial Burst)
                else if (e.bossTier === 2) {
                    e.timer = 180; // Faster 3s
                    for(let i=0; i<12; i++) {
                        const angle = (Math.PI * 2 / 12) * i;
                        this.projectiles.push({
                            x: e.x, y: e.y, vx: Math.cos(angle)*5, vy: Math.sin(angle)*5, radius: 6, color: COLORS.enemy,
                            angle: angle, life: 120, tags: [], pierce: 0, isHoming: false, hasSplit: false, markedForDeletion: false
                        });
                    }
                    sfx.explosion();
                }
                // Tier 3: Carrier (Charge + Fast Spawn)
                else if (e.bossTier === 3) {
                    e.timer = 240;
                    for(let i=0; i<4; i++) {
                        this.enemies.push({
                             x: e.x, y: e.y, vx:0, vy:0, type:'fast', radius:10, color:COLORS.fast,
                             hp: 15 * this.difficulty, maxHp: 15 * this.difficulty, speed: 3, freezeTimer: 0, shield: 0, hitFlash: 0, pushX:0, pushY:0, markedForDeletion: false, timer:0, maxTimer:0
                        });
                    }
                    // Charge Logic
                    const ang = Math.atan2(this.core.y - e.y, this.core.x - e.x);
                    e.pushX = Math.cos(ang) * 30;
                    e.pushY = Math.sin(ang) * 30;
                    sfx.shoot();
                }
            }
        }

        const dx = this.core.x - e.x;
        const dy = this.core.y - e.y;
        const dist = Math.hypot(dx, dy);
        
        let spd = e.speed;
        if (e.freezeTimer > 0) { spd *= 0.5; e.freezeTimer--; }

        // --- BOIDS / SWARM SEPARATION LOGIC ---
        // Calculate soft collision push from other enemies to prevent stacking
        let sepX = 0, sepY = 0;
        for (const other of this.enemies) {
            if (other === e) continue;
            const odx = e.x - other.x;
            const ody = e.y - other.y;
            const odist = Math.hypot(odx, ody);
            const minDist = e.radius + other.radius + 5;
            
            if (odist < minDist && odist > 0) {
                const force = (minDist - odist) / minDist; // 0 to 1
                sepX += (odx / odist) * force * 2; // Push away strength
                sepY += (ody / odist) * force * 2;
            }
        }

        // Target vector
        let tx = (dx / dist) * spd;
        let ty = (dy / dist) * spd;
        
        // Add separation force to movement
        tx += sepX;
        ty += sepY;

        e.x += tx;
        e.y += ty;

        // Apply Knockback with resistance
        if (Math.abs(e.pushX) > 0.1 || Math.abs(e.pushY) > 0.1) {
            e.x += e.pushX;
            e.y += e.pushY;
            e.pushX *= 0.9; e.pushY *= 0.9;
        }

        // Core Collision
        if (dist < e.radius + 25) {
            let dmg = (e.type === 'boss' ? 50 : 10);
            if (e.type === 'swarm') dmg = 5; // Low damage for swarm
            
            this.stats.hp -= dmg;
            this.addFloatingText(this.core.x, this.core.y, `-${dmg}`, '#ef4444', 20);
            this.shake = 15;
            this.explosion(this.core.x, this.core.y, '#ef4444', 10);
            sfx.hit();
            
            if (e.type !== 'boss') e.markedForDeletion = true;
            
            if (this.stats.hp <= 0) {
                this.isGameOver = true;
                sfx.gameOver();
                this.onGameOver(this.score);
            }
        }
        
        if (e.hitFlash > 0) e.hitFlash--;
    });

    this.enemies = this.enemies.filter(e => !e.markedForDeletion);
  }

  updateOrbitals() {
      const speed = 0.05;
      this.orbitals.forEach(o => {
          o.angle += speed;
          const ox = this.core.x + Math.cos(o.angle) * o.radius;
          const oy = this.core.y + Math.sin(o.angle) * o.radius;
          
          this.enemies.forEach(e => {
              if (Math.hypot(e.x - ox, e.y - oy) < e.radius + 10 && e.hitFlash <= 0) {
                  e.hp -= this.stats.atk;
                  e.hitFlash = 5;
                  this.addFloatingText(e.x, e.y - e.radius, Math.ceil(this.stats.atk).toString(), '#10b981', 12);
                  this.particles.push({ x: ox, y: oy, vx:0, vy:0, radius: 3, color: '#10b981', life: 10, maxLife: 10, markedForDeletion: false });
                  sfx.hit();
                  if (e.hp <= 0) this.killEnemy(e);
              }
          });
      });
  }

  updateProjectiles() {
    this.projectiles.forEach(p => {
        // Enemy Projectiles (From Boss Tier 2) don't hit enemies
        if (p.color === COLORS.enemy) {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            
            // Hit Player?
            if (Math.hypot(p.x - this.core.x, p.y - this.core.y) < 25) {
                this.stats.hp -= 10;
                this.shake = 5;
                sfx.hit();
                p.markedForDeletion = true;
            }
            
            if (p.life <= 0) p.markedForDeletion = true;
            return;
        }

        if (p.isHoming) {
            const target = this.getNearestEnemy(p.x, p.y);
            if (target) {
                const ta = Math.atan2(target.y - p.y, target.x - p.x);
                let diff = ta - p.angle;
                while(diff < -Math.PI) diff += Math.PI*2;
                while(diff > Math.PI) diff -= Math.PI*2;
                p.angle += diff * 0.15;
                p.vx = Math.cos(p.angle) * this.stats.projSpeed;
                p.vy = Math.sin(p.angle) * this.stats.projSpeed;
            }
        }

        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        if (p.life <= 0 || p.x < 0 || p.x > this.width || p.y < 0 || p.y > this.height) {
            p.markedForDeletion = true;
        }
        
        if (!p.markedForDeletion) {
            for (let e of this.enemies) {
                if (Math.hypot(p.x - e.x, p.y - e.y) < e.radius + p.radius) {
                    this.hitEnemy(e, p);
                    
                    if (this.ult.active) { /* Pierce */ }
                    else if (p.pierce > 0) { p.pierce--; }
                    else { p.markedForDeletion = true; }
                    
                    if (p.tags.includes('BLAST')) this.aoeDamage(e.x, e.y, 80, this.stats.atk * 0.5);
                    if (p.tags.includes('CHAIN')) this.chainLightning(e);
                    break; 
                }
            }
        }
    });
    this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);
  }

  hitEnemy(e: Enemy, p?: Projectile) {
    let dmg = this.stats.atk;
    if (p) {
        if (p.tags.includes('GIANT')) dmg *= 1.5;
        if (p.tags.includes('FREEZE')) e.freezeTimer = 120;
        
        // Knockback Logic
        if (p.tags.includes('KNOCK') || p.isHoming) {
            let kbPower = 6;
            if (e.type === 'boss') kbPower = 0.2; 
            else if (e.type === 'tank') kbPower = 2;
            else if (e.type === 'swarm') kbPower = 8; // Swarm flies back easily
            
            e.pushX += Math.cos(p.angle) * kbPower;
            e.pushY += Math.sin(p.angle) * kbPower;
        }
    }
    
    if (this.ult.active) dmg *= 2;
    
    const isCrit = Math.random() < this.stats.critRate;
    if (isCrit) dmg *= this.stats.critDmg;

    if (e.shield > 0) {
        e.shield -= dmg;
        this.addFloatingText(e.x, e.y - e.radius, "ABSORB", '#3b82f6', 10);
        if(e.shield < 0) {
            e.hp += e.shield; // Apply overflow damage
            e.shield = 0;
        }
    } else {
        e.hp -= dmg;
    }

    const displayDmg = Math.ceil(dmg);
    this.addFloatingText(e.x, e.y - e.radius, displayDmg.toString(), isCrit ? '#facc15' : '#ffffff', isCrit ? 20 : 12, isCrit);

    e.hitFlash = 5;
    this.explosion(e.x, e.y, e.color, 2);
    sfx.hit();

    if (isCrit) {
        this.explosion(e.x, e.y, '#facc15', 5);
        sfx.crit();
    }

    if (e.hp <= 0 && !e.markedForDeletion) {
        e.markedForDeletion = true;
        this.killEnemy(e);
    }
  }

  killEnemy(e: Enemy) {
    this.score += (e.type === 'boss' ? 1000 : e.type === 'swarm' ? 5 : 10 * (1 + this.difficulty));
    
    // Reduce drop spam for swarms
    if (e.type !== 'swarm' || Math.random() < 0.2) {
        this.xpOrbs.push({ x: e.x, y: e.y, vx: 0, vy: 0, radius: 4, color: COLORS.xp, markedForDeletion: false, value: e.type === 'boss' ? 100 : 10 });
    }
    
    sfx.explosion();

    const dropChance = (e.type === 'boss' ? 1.0 : 0.01) * this.stats.luck;
    if (Math.random() < dropChance) {
        this.chests.push({ x: e.x, y: e.y, vx: 0, vy: 0, radius: 10, color: COLORS.chest, markedForDeletion: false });
        this.chests[this.chests.length-1].vx = (Math.random()-0.5)*2;
        this.chests[this.chests.length-1].vy = (Math.random()-0.5)*2;
        this.addFloatingText(e.x, e.y, "CHEST!", COLORS.chest, 18);
    }

    if (e.type === 'splitter') {
        for(let i=0; i<2; i++) {
            this.enemies.push({ ...e, type: 'splitter_mini', radius: 10, hp: 5 * this.difficulty, maxHp: 5, x: e.x + (Math.random()*20-10), y: e.y, markedForDeletion: false });
        }
    }
    
    if ((this.core.tags.includes('VAMP') || this.core.relics.includes('R_VAMP')) && Math.random() < 0.1) {
        this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + 2);
        this.addFloatingText(this.core.x, this.core.y, "+2", "#22c55e", 16);
    }
    
    if (!this.ult.active) {
        // Less charge from swarm
        const charge = e.type === 'swarm' ? 1 : 5;
        this.ult.charge = Math.min(this.ult.maxCharge, this.ult.charge + charge);
    }
  }

  aoeDamage(x: number, y: number, r: number, dmg: number) {
    this.enemies.forEach(e => {
        if (Math.hypot(e.x - x, e.y - y) < r) {
            e.hp -= dmg;
            e.hitFlash = 5;
            this.addFloatingText(e.x, e.y - e.radius, Math.ceil(dmg).toString(), '#fff', 10);
            if (e.hp <= 0) this.killEnemy(e);
        }
    });
    this.explosion(x, y, '#f97316', 10);
  }

  chainLightning(source: Enemy) {
    const range = 200;
    const targets = this.enemies
        .filter(e => e !== source && Math.hypot(e.x - source.x, e.y - source.y) < range)
        .sort((a, b) => Math.hypot(a.x - source.x, a.y - source.y) - Math.hypot(b.x - source.x, b.y - source.y));
    
    if (targets.length > 0) {
        const target = targets[0];
        // Create Jagged Beam
        const points = [];
        const steps = 5;
        const dx = (target.x - source.x) / steps;
        const dy = (target.y - source.y) / steps;
        for(let i=1; i<steps; i++) {
            points.push({
                x: source.x + dx * i + (Math.random()-0.5) * 30,
                y: source.y + dy * i + (Math.random()-0.5) * 30
            });
        }
        this.beams.push({ x1: source.x, y1: source.y, x2: target.x, y2: target.y, life: 10, color: '#facc15', points });
        this.hitEnemy(target);
    }
  }

  updateXP() {
    this.xpOrbs.forEach(orb => {
        const dx = this.core.x - orb.x;
        const dy = this.core.y - orb.y;
        const dist = Math.hypot(dx, dy);
        
        const pull = dist < this.stats.pickupRange ? 15 : 2;
        orb.x += (dx / dist) * pull;
        orb.y += (dy / dist) * pull;
        
        if (dist < 20) {
            orb.markedForDeletion = true;
            sfx.collectXP();
            this.core.xp += orb.value * this.stats.xpMult;
            if (this.core.xp >= this.core.nextXp) {
                this.core.xp -= this.core.nextXp;
                this.core.level++;
                this.core.nextXp = Math.floor(this.core.nextXp * 1.4);
                sfx.levelUp();
                this.onUpgrade();
            }
        }
    });
    this.xpOrbs = this.xpOrbs.filter(o => !o.markedForDeletion);
  }

  updateChests() {
      this.chests.forEach(c => {
          // Friction on initial spawn velocity
          c.x += c.vx; c.y += c.vy;
          c.vx *= 0.9; c.vy *= 0.9;

          const dx = this.core.x - c.x;
          const dy = this.core.y - c.y;
          const dist = Math.hypot(dx, dy);
          
          // GLOBAL MAGNET BEHAVIOR
          // Far away = slow drift. Close = Fast snap.
          let pullSpeed = 0;
          if (dist > 500) pullSpeed = 2;
          else if (dist > 200) pullSpeed = 6;
          else pullSpeed = 20; // Snap when close

          c.x += (dx / dist) * pullSpeed;
          c.y += (dy / dist) * pullSpeed;

          if (dist < 30) {
              c.markedForDeletion = true;
              const availableRelics = RELICS.filter(r => !this.core.relics.includes(r.id));
              if (availableRelics.length > 0) {
                  const picked = availableRelics[Math.floor(Math.random() * availableRelics.length)];
                  this.onRelicFound(picked.id);
              } else {
                  this.core.xp += 500;
                  sfx.levelUp();
                  this.addFloatingText(this.core.x, this.core.y, "+500 XP", COLORS.xp, 20);
              }
          }
      });
      this.chests = this.chests.filter(c => !c.markedForDeletion);
  }

  updateParticles() {
      this.particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.life--;
          p.markedForDeletion = p.life <= 0;
      });
      this.particles = this.particles.filter(p => !p.markedForDeletion);
  }

  updateFloatingTexts() {
      this.floatingTexts.forEach(t => {
          t.y -= 1; 
          t.life--;
          t.markedForDeletion = t.life <= 0;
      });
      this.floatingTexts = this.floatingTexts.filter(t => !t.markedForDeletion);
  }
  
  updateBeams() {
      this.beams.forEach(b => {
          b.life--;
          // Jitter effect
          b.points.forEach(p => {
              p.x += (Math.random()-0.5)*5;
              p.y += (Math.random()-0.5)*5;
          });
      });
      this.beams = this.beams.filter(b => b.life > 0);
  }

  addFloatingText(x: number, y: number, text: string, color: string, size: number, isCrit: boolean = false) {
      this.floatingTexts.push({
          x, y, text, color, size, isCrit,
          life: 40, maxLife: 40, markedForDeletion: false
      });
  }

  explosion(x: number, y: number, color: string, count: number) {
      for(let i=0; i<count; i++) {
          this.particles.push({
              x, y, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
              radius: Math.random() * 3, color: color,
              life: Math.random() * 20 + 10, maxLife: 30, markedForDeletion: false
          });
      }
  }

  getNearestEnemy(x: number, y: number): Enemy | null {
    let nearest = null;
    let minDst = Infinity;
    for (let e of this.enemies) {
        let d = Math.hypot(e.x - x, e.y - y);
        if (d < minDst) { minDst = d; nearest = e; }
    }
    return nearest;
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.3)'; 
    ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw Grid (Map Background)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < this.width; x += 50) { ctx.moveTo(x, 0); ctx.lineTo(x, this.height); }
    for (let y = 0; y < this.height; y += 50) { ctx.moveTo(0, y); ctx.lineTo(this.width, y); }
    ctx.stroke();

    ctx.save();
    if (this.shake > 0) {
        ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
        this.shake *= 0.9;
    }

    // Draw Beams (Lightning)
    this.beams.forEach(b => {
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = b.life / 10;
        ctx.beginPath(); 
        ctx.moveTo(b.x1, b.y1); 
        b.points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(b.x2, b.y2); 
        ctx.stroke();
        ctx.globalAlpha = 1;
    });

    this.xpOrbs.forEach(o => {
        ctx.fillStyle = o.color;
        ctx.beginPath(); ctx.arc(o.x, o.y, 4, 0, Math.PI*2); ctx.fill();
    });

    this.chests.forEach(c => {
        ctx.save();
        ctx.translate(c.x, c.y);
        const bob = Math.sin(this.frames * 0.1) * 5;
        ctx.translate(0, bob);
        ctx.shadowColor = c.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = c.color;
        ctx.beginPath(); ctx.roundRect(-c.radius, -c.radius*0.8, c.radius*2, c.radius*1.6, 4); ctx.fill();
        ctx.fillStyle = '#b45309'; ctx.fillRect(-c.radius, -2, c.radius*2, 4);
        ctx.restore();
    });

    this.projectiles.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = this.ult.active ? '#facc15' : p.color;
        ctx.shadowColor = this.ult.active ? '#facc15' : p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.roundRect(-p.radius*1.5, -p.radius, p.radius*3, p.radius*2, 4); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
    });

    this.enemies.forEach(e => {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.fillStyle = e.hitFlash > 0 ? '#fff' : (e.freezeTimer > 0 ? '#bae6fd' : e.color);
        
        ctx.beginPath();
        if (e.type === 'boss') {
            ctx.arc(0, 0, e.radius, 0, Math.PI*2);
            ctx.moveTo(0,0); ctx.arc(0, 0, e.radius + 5, 0, (Math.PI*2) * (e.hp / e.maxHp)); 
            ctx.strokeStyle = 'red'; ctx.lineWidth = 4; ctx.stroke();
            if (e.shield > 0) {
                ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0,0,e.radius+8,0,Math.PI*2); ctx.stroke();
            }
        } else if (e.type === 'tank') {
            ctx.rect(-e.radius, -e.radius, e.radius*2, e.radius*2);
        } else if (e.type === 'fast') {
            ctx.moveTo(e.radius, 0); ctx.lineTo(-e.radius, e.radius); ctx.lineTo(-e.radius, -e.radius);
        } else if (e.type === 'swarm') {
            // Draw small triangle
            const r = e.radius;
            ctx.rotate(Math.atan2(this.core.y - e.y, this.core.x - e.x));
            ctx.moveTo(r, 0); ctx.lineTo(-r, r/1.5); ctx.lineTo(-r, -r/1.5);
        } else {
            ctx.arc(0, 0, e.radius, 0, Math.PI*2);
        }
        ctx.fill();
        ctx.restore();
    });

    this.particles.forEach(p => {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1;
    });

    this.floatingTexts.forEach(t => {
        ctx.save();
        ctx.globalAlpha = t.life / t.maxLife;
        ctx.fillStyle = t.color;
        ctx.font = `900 ${t.size}px Nunito`;
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.strokeText(t.text, t.x, t.y);
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
    });

    if (this.orbitals.length > 0) {
        this.orbitals.forEach(o => {
            const ox = this.core.x + Math.cos(o.angle) * o.radius;
            const oy = this.core.y + Math.sin(o.angle) * o.radius;
            ctx.shadowColor = '#10b981'; ctx.shadowBlur = 10;
            ctx.fillStyle = '#059669'; ctx.beginPath(); ctx.arc(ox, oy, 6, 0, Math.PI*2); ctx.fill(); 
            ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(ox, oy-2, 4, 0, Math.PI*2); ctx.fill(); 
            ctx.shadowBlur = 0;
        });
    }

    ctx.save();
    ctx.translate(this.core.x, this.core.y);
    ctx.rotate(this.core.angle);
    ctx.fillStyle = COLORS.coreDark;
    ctx.beginPath(); ctx.roundRect(-15, -15, 30, 30, 6); ctx.fill();
    ctx.fillStyle = COLORS.proj;
    ctx.beginPath(); ctx.rect(0, -6, 25, 12); ctx.fill();
    ctx.fillStyle = this.ult.active ? '#facc15' : COLORS.core;
    ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI*2); ctx.fill();
    ctx.restore();
    ctx.restore();
  }
}