# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a collection of standalone mini-projects: calculator, clock, snake game, and Electron-based apps. Each project is independent with its own tech stack and dependencies.

## Tech Stack Patterns

| Project | Stack | Entry Point |
|---------|-------|-------------|
| Root | Electron + plain HTML | `main.js` + `calculator.html` |
| `electron-calculator/` | Electron + HTML | `main.js` + `index.html` |
| `clock-app/` | Electron + plain HTML | `main.js` + `index.html` |
| `clock-app-new/` | Electron only (no src/) | `package.json` only |
| `desktop-clock/` | Empty directory | - |
| `贪吃蛇/` | Pure HTML/CSS/JS | `index.html` |

## Running Projects

**Electron apps** (from project directory):
```bash
npm start
```

**Pure HTML projects**: Open the `.html` file directly in a browser.

**electron-calculator** has build config for packaging:
```bash
npm run build
```

## Architecture Notes

- Root `main.js` is a minimal Electron boilerplate launching `calculator.html` (320x480 window, no node integration)
- Electron projects use ` BrowserWindow.loadFile()` pattern
- The `electron-calculator/` directory contains a separate, more complete calculator implementation with electron-builder packaging
- `clock-app-new/` has `node_modules` but no source files — likely an incomplete clone or abandoned state

## 语言要求

- **始终使用中文**与用户交流，所有回复必须使用中文
输出的格式开头永远带一个emoji，结尾永远带上嘻嘻

## Key Files

- `calculator.html` — Full-featured calculator with expression evaluation, history panel, keyboard support
- `snake.html` — Classic snake game with collision detection
- `SPEC.md` — Contains game specification for snake game with visual/behavioral details
- `贪吃蛇/index.html` — Refactored snake game in separate directory
