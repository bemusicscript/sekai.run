[![BuyMeACoffee](https://raw.githubusercontent.com/pachadotdev/buymeacoffee-badges/main/bmc-yellow.svg)](https://www.buymeacoffee.com/azukoha302)

## [sekai.run](https://sekai.run/)

This repository contains the main codebase for **Sekai Scoreboard**, excluding critical infrastructure and essential components.  
The service runs smoothly with over **1,000 concurrent connections** on a single **ODROID-H4** machine. There are no stress tests done directly from the system, but it is likely that the server can allow even more throughput thanks to Cloudflare's caching system.

The scoreboard automatically updates every minute from the game server and also from the browser, allowing you to keep it open and play without needing a secondary device during event runs.

> ⚠️ **Note**
>
> This codebase will not function out of the box, as several important parts have been redacted or not committed.  
> You may, however, use it as a **reference implementation**.

Due to frequent large-scale design changes and the use of specialized libraries for optimized performance and throughput, parts of the codebase may appear messy or experimental.



## 🧩 Demo

https://github.com/user-attachments/assets/a35370f8-ec1a-478c-861e-8859945c6107


## ⚙️ Architecture

### **Device**
- **ODROID-H4** (Intel i3-1215U, 32GB RAM)  
  Handles ~1,000 concurrent connections reliably and efficiently.

### **Networking**
- **Cloudflare**
  - Heavily caches static files and APIs to reduce server load under high traffic.
  - WebSocket was avoided as it cannot be cached effectively.
- **Caddy / Nginx**
  - All internal communication occurs over HTTP/2 or HTTP/3 to avoid performance penalties from protocol downgrades.

### **Backend**
- **Python**
  - Fully working game client written entirely in Python *(removed for security reasons, originally built with help from TWY)*.
  - Automatic Unity game version updater.
  - `aiocache` for sharing sessions across multiple processes (cached via Valkey or Redis).
  - `FastAPI` + `Uvicorn` for performance-oriented async serving.
  - `orjson` for ultra-fast JSON serialization.
- **Node.js**
  - **Predictions Crawler**
    - Originally implemented custom prediction/statistics logic; now replaced by Jiiku’s system for higher accuracy.
    - Early version sandboxed using QuickJS before Jiiku introduced a new format.
  - JavaScript obfuscation using `js-confuser` to prevent reverse engineering (resistant to GPT/webcrack/deobfuscators).
- **MariaDB**
  - Performance-tuned for ODROID-H4, with optimized index keys for faster `SELECT` operations.
- **PHP**
  - Used where simplicity and speed matter; ideal for non-commercial tasks.

### **Frontend**
- **Semi-vanilla JavaScript**
  - Avoids React/Vue for obfuscation and performance reasons.
  - Extensively modified Bootstrap for multi-draggable dialog support and scoreboard layouts.
