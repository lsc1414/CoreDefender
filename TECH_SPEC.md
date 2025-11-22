# 核心防御者 (CORE DEFENDER) - 技术规格文档
**版本:** 1.0

## 1. 架构概述
本项目采用 **React 18** + **HTML5 Canvas** 的混合架构。
*   **React**: 负责 UI 层（HUD、菜单、弹窗）、状态管理（useState/useRef）以及局外持久化数据。
*   **Canvas (GameEngine)**: 负责高性能的游戏主循环、物理碰撞、粒子渲染和实体管理。

## 2. 目录结构
```
src/
├── components/
│   └── UIOverlay.tsx    # 负责所有非 Canvas 的 UI 渲染
├── services/
│   └── gameEngine.ts    # 游戏核心逻辑类，脱离 React 生命周期
├── types.ts             # TypeScript 类型定义
├── constants.ts         # 游戏数值配置、颜色、Tag定义
├── App.tsx              # 入口组件，桥接 React 和 GameEngine
└── index.tsx            # 挂载点
```

## 3. 核心模块详解

### 3.1 GameEngine (gameEngine.ts)
这是一个独立 Class，不依赖 React。
*   **Loop**: 使用 `requestAnimationFrame` 控制游戏循环。
*   **Update**: 处理逻辑（移动、碰撞、生成）。
*   **Draw**: 处理 Canvas 绘图（clearRect -> draw entities）。
*   **Entity Management**: 使用数组管理 `enemies`, `projectiles`, `particles`, `floatingTexts`。
*   **Callback System**: 通过构造函数传入回调 (`onGameOver`, `onSyncUI`) 与 React 通信。

### 3.2 实体系统
所有实体通过简单的对象数组管理，每帧遍历更新。
*   **Enemy**: 包含简单的 AI（寻路），通过 `pushX/Y` 实现击退物理效果。
*   **Projectile**: 包含 `tags` 数组，根据 Tag 决定命中逻辑（如穿透、爆炸、减速）。
*   **FloatingText (新增)**:
    *   属性: `x`, `y`, `text`, `life`, `velocity`, `isCrit`
    *   逻辑: 向上飘动并逐渐透明。

### 3.3 状态同步
React 和 Canvas 运行在不同频率。
*   **频率**: `GameEngine` 每 10 帧调用一次 `onSyncUI`，将核心数据（HP, Score, Tags等）同步给 React State。
*   **性能**: 避免每帧同步导致 React 重绘卡顿。

### 3.4 数据持久化
*   使用 `localStorage` 存储 Key `cd_react_meta`。
*   数据结构包含：`tp` (货币), `bestScore` (最高分), `upgrades` (购买等级对象)。

## 4. 关键算法

### 4.1 碰撞检测
采用简单的 **圆形碰撞 (Circle-Circle Collision)** 检测实体交互，**AABB** 检测矩形障碍物。
*   优化: 空间分割未实现（当前实体数量较少，O(N^2) 可接受）。

### 4.2 技能系统 (Tags)
*   **Tag**: 字符串标识符（如 "SPLIT", "GIANT"）。
*   **应用**:
    *   射击时: 检查 Core 的 tags 决定发射数量、角度。
    *   命中时: 检查 Projectile 的 tags 决定特效（爆炸、连锁）。
*   **羁绊**: 在 `onUpgrade` 后或特定检查点，遍历当前 Tags 数组，匹配 `SYNERGIES` 配置表。

## 5. 视觉规范
*   **子弹**: `#22d3ee` (Cyan-400) - 确保在深色背景(`#0f172a`)下可见。
*   **字体**: `Nunito` (Google Fonts)。
*   **伤害数字**: 
    *   普通: 白色，字号 12px。
    *   暴击: 黄色，字号 20px，带上浮动画。

## 6. 待优化项
*   音效系统整合。
*   移动端触摸摇杆优化。
*   后期实体过多时的性能优化 (Object Pooling)。