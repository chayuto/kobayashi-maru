# Code Audit: Security & Best Practices

**Date:** 2025-11-30  
**Scope:** Security vulnerabilities, data validation, and secure coding practices

## Executive Summary

As a client-side game, security risks are limited but not absent. Input validation is minimal, localStorage usage is unencrypted, and there's no protection against cheating or data tampering.

**Overall Grade:** C (Basic security with room for improvement)

---

## Security Context

**Game Type:** Client-side browser game  
**Attack Surface:** Limited (no server, no user accounts)  
**Primary Risks:**
- XSS through user input
- LocalStorage tampering
- Client-side cheating
- Resource exhaustion (DoS)

---

## Current Security Posture

### Strengths ✅

1. **No Server Communication**
   - No API endpoints to exploit
   - No authentication to bypass
   - No sensitive data transmission

2. **TypeScript Type Safety**
   - Prevents many runtime errors
   - Catches type mismatches at compile time

3. **No User-Generated Content**
   - No text input from users
   - No file uploads
   - Limited XSS attack surface

### Weaknesses ❌

1. **No Input Validation**
2. **Unencrypted LocalStorage**
3. **No Anti-Cheat Measures**
4. **No Rate Limiting**
5. **No Content Security Policy**

---

## Security Issues

### 1. ⚠️ LocalStorage Tampering

**Problem:**
```typescript
// StorageService.ts - No validation or encryption
public save<T>(key: StorageKeys, data: T): void {
  const serializedData = JSON.stringify(data);
  this.storage.setItem(key, serializedData);
  // Anyone can modify localStorage in DevTools!
}

public load<T>(key: StorageKeys, defaultValue: T): T {
  const serializedData = this.storage.getItem(key);
  return JSON.parse(serializedData) as T;
  // No validation that data is legitimate
}
```

**Impact:**
- Users can modify high scores
- Game state can be manipulated
- Achievements can be faked

**Recommendation:**
```typescript
// Add data integrity checking
import { createHash } from 'crypto';

interface SecureData<T> {
  data: T;
  signature: string;
  timestamp: number;
}

class SecureStorageService {
  private readonly SECRET_KEY = 'game-secret-key-v1'; // In production, use env var
  
  public save<T>(key: StorageKeys, data: T): void {
    const secureData: SecureData<T> = {
      data,
      signature: this.sign(data),
      timestamp: Date.now()
    };
    
    const serialized = JSON.stringify(secureData);
    this.storage.setItem(key, serialized);
  }
  
  public load<T>(key: StorageKeys, defaultValue: T): T {
    try {
      const serialized = this.storage.getItem(key);
      if (!serialized) return defaultValue;
      
      const secureData = JSON.parse(serialized) as SecureData<T>;
      
      // Verify signature
      if (!this.verify(secureData.data, secureData.signature)) {
        console.warn(`Data integrity check failed for ${key}`);
        return defaultValue;
      }
      
      // Check if data is too old (optional)
      const age = Date.now() - secureData.timestamp;
      if (age > 30 * 24 * 60 * 60 * 1000) { // 30 days
        console.warn(`Stored data for ${key} is too old`);
        return defaultValue;
      }
      
      return secureData.data;
      
    } catch (error) {
      console.error(`Failed to load secure data for ${key}:`, error);
      return defaultValue;
    }
  }
  
  private sign(data: unknown): string {
    const payload = JSON.stringify(data) + this.SECRET_KEY;
    // In browser, use SubtleCrypto API
    return this.simpleHash(payload);
  }
  
  private verify(data: unknown, signature: string): boolean {
    return this.sign(data) === signature;
  }
  
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
}

// Better: Use Web Crypto API
class CryptoStorageService {
  private async generateKey(): Promise<CryptoKey> {
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('game-secret-key-v1'),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'HMAC', hash: 'SHA-256', length: 256 },
      false,
      ['sign', 'verify']
    );
  }
  
  private async sign(data: string): Promise<string> {
    const key = await this.generateKey();
    const signature = await window.crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(data)
    );
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }
  
  private async verify(data: string, signature: string): Promise<boolean> {
    const key = await this.generateKey();
    const signatureBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
    
    return window.crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      new TextEncoder().encode(data)
    );
  }
}
```

### 2. ⚠️ No Input Sanitization

**Problem:**
```typescript
// If we add user input in the future (e.g., player name)
function setPlayerName(name: string): void {
  // No sanitization!
  document.getElementById('player-name')!.innerHTML = name;
  // XSS vulnerability if name contains <script>
}
```

**Recommendation:**
```typescript
// Always sanitize user input
function sanitizeHTML(str: string): string {
  const div = document.createElement('div');
  div.textContent = str; // textContent automatically escapes
  return div.innerHTML;
}

function setPlayerName(name: string): void {
  // Validate length
  if (name.length > 50) {
    throw new Error('Player name too long');
  }
  
  // Sanitize
  const sanitized = sanitizeHTML(name);
  
  // Use textContent instead of innerHTML
  const element = document.getElementById('player-name');
  if (element) {
    element.textContent = sanitized;
  }
}

// Better: Use a library like DOMPurify
import DOMPurify from 'dompurify';

function setPlayerName(name: string): void {
  const clean = DOMPurify.sanitize(name, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: []
  });
  
  document.getElementById('player-name')!.textContent = clean;
}
```

### 3. ⚠️ No Content Security Policy

**Problem:** No CSP headers to prevent XSS

**Recommendation:**
```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="
        default-src 'self';
        script-src 'self' 'unsafe-eval';
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: blob:;
        font-src 'self';
        connect-src 'self';
        frame-ancestors 'none';
        base-uri 'self';
        form-action 'self';
      ">
```

Or configure in Vite:
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; ')
    }
  }
});
```

### 4. ⚠️ Resource Exhaustion

**Problem:**
```typescript
// No limits on entity creation
for (let i = 0; i < userInput; i++) {
  createKlingonShip(world, x, y);
  // Could create millions of entities and crash browser
}
```

**Recommendation:**
```typescript
// Add resource limits
const RESOURCE_LIMITS = {
  MAX_ENTITIES: 10000,
  MAX_PARTICLES: 15000,
  MAX_TEXTURES: 100,
  MAX_SOUNDS: 50
} as const;

class ResourceManager {
  private entityCount: number = 0;
  private particleCount: number = 0;
  
  canCreateEntity(): boolean {
    return this.entityCount < RESOURCE_LIMITS.MAX_ENTITIES;
  }
  
  createEntity(factory: () => number): number | null {
    if (!this.canCreateEntity()) {
      console.warn('Entity limit reached');
      return null;
    }
    
    const eid = factory();
    this.entityCount++;
    return eid;
  }
  
  destroyEntity(eid: number): void {
    // Destroy entity
    this.entityCount--;
  }
}

// Usage
const resourceManager = new ResourceManager();

function spawnEnemy(x: number, y: number): number | null {
  return resourceManager.createEntity(() => 
    createKlingonShip(world, x, y)
  );
}
```

### 5. ⚠️ No Rate Limiting

**Problem:** No protection against rapid actions

**Recommendation:**
```typescript
// Rate limiter for actions
class RateLimiter {
  private timestamps: Map<string, number[]> = new Map();
  
  isAllowed(
    action: string,
    maxCalls: number,
    windowMs: number
  ): boolean {
    const now = Date.now();
    const key = action;
    
    if (!this.timestamps.has(key)) {
      this.timestamps.set(key, []);
    }
    
    const calls = this.timestamps.get(key)!;
    
    // Remove old timestamps outside window
    const cutoff = now - windowMs;
    const recentCalls = calls.filter(ts => ts > cutoff);
    
    if (recentCalls.length >= maxCalls) {
      return false; // Rate limit exceeded
    }
    
    recentCalls.push(now);
    this.timestamps.set(key, recentCalls);
    
    return true;
  }
}

// Usage
const rateLimiter = new RateLimiter();

function handleTurretPlacement(x: number, y: number): void {
  // Allow max 10 placements per second
  if (!rateLimiter.isAllowed('turret-placement', 10, 1000)) {
    console.warn('Turret placement rate limit exceeded');
    return;
  }
  
  placeTurret(x, y);
}
```

---

## Anti-Cheat Measures

### 1. Client-Side Validation

**Even though it can be bypassed, it deters casual cheating:**

```typescript
class GameValidator {
  private lastScore: number = 0;
  private lastUpdate: number = Date.now();
  
  validateScoreIncrease(newScore: number): boolean {
    const increase = newScore - this.lastScore;
    const timeDelta = Date.now() - this.lastUpdate;
    
    // Check if score increase is reasonable
    const maxPossibleIncrease = (timeDelta / 1000) * 100; // 100 points per second max
    
    if (increase > maxPossibleIncrease) {
      console.error('Suspicious score increase detected');
      return false;
    }
    
    this.lastScore = newScore;
    this.lastUpdate = Date.now();
    return true;
  }
  
  validateEntityPosition(eid: number): boolean {
    const x = Position.x[eid];
    const y = Position.y[eid];
    
    // Check if position is within bounds
    if (x < 0 || x > GAME_CONFIG.WORLD_WIDTH ||
        y < 0 || y > GAME_CONFIG.WORLD_HEIGHT) {
      console.error(`Entity ${eid} has invalid position: (${x}, ${y})`);
      return false;
    }
    
    return true;
  }
  
  validateVelocity(eid: number): boolean {
    const vx = Velocity.x[eid];
    const vy = Velocity.y[eid];
    const speed = Math.sqrt(vx * vx + vy * vy);
    
    // Check if speed is reasonable
    const MAX_SPEED = 500; // pixels per second
    
    if (speed > MAX_SPEED) {
      console.error(`Entity ${eid} has suspicious velocity: ${speed}`);
      return false;
    }
    
    return true;
  }
}
```

### 2. Obfuscation (Optional)

**For production builds:**

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { obfuscator } from 'rollup-obfuscator';

export default defineConfig({
  build: {
    rollupOptions: {
      plugins: [
        obfuscator({
          compact: true,
          controlFlowFlattening: true,
          deadCodeInjection: true,
          stringArray: true,
          stringArrayThreshold: 0.75
        })
      ]
    }
  }
});
```

---

## Secure Coding Practices

### 1. Avoid eval() and Function()

**Never do this:**
```typescript
// DANGEROUS!
const userCode = getUserInput();
eval(userCode);
```

### 2. Validate All External Data

```typescript
function loadGameState(data: unknown): GameState | null {
  // Validate structure
  if (typeof data !== 'object' || data === null) {
    return null;
  }
  
  const state = data as Record<string, unknown>;
  
  // Validate each field
  if (typeof state.score !== 'number' || state.score < 0) {
    return null;
  }
  
  if (typeof state.wave !== 'number' || state.wave < 1) {
    return null;
  }
  
  // Use a validation library like Zod
  return state as GameState;
}

// Better: Use Zod for validation
import { z } from 'zod';

const GameStateSchema = z.object({
  phase: z.enum(['menu', 'playing', 'paused', 'gameover']),
  score: z.number().min(0),
  wave: z.number().min(1),
  lives: z.number().min(0).max(10),
  highScore: z.number().min(0),
  enemiesDestroyed: z.number().min(0),
  timeElapsed: z.number().min(0)
});

function loadGameState(data: unknown): GameState | null {
  try {
    return GameStateSchema.parse(data);
  } catch (error) {
    console.error('Invalid game state:', error);
    return null;
  }
}
```

### 3. Use Strict Mode

```typescript
// Already enabled in tsconfig.json ✅
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### 4. Prevent Prototype Pollution

```typescript
// When parsing JSON from localStorage
function safeJSONParse<T>(str: string): T | null {
  try {
    const parsed = JSON.parse(str);
    
    // Check for __proto__ pollution
    if (parsed && typeof parsed === 'object') {
      if ('__proto__' in parsed || 'constructor' in parsed || 'prototype' in parsed) {
        console.error('Potential prototype pollution detected');
        return null;
      }
    }
    
    return parsed as T;
  } catch {
    return null;
  }
}
```

---

## Privacy Considerations

### 1. No Tracking Without Consent

```typescript
class AnalyticsManager {
  private enabled: boolean = false;
  
  async init(): Promise<void> {
    // Check if user has consented
    const consent = localStorage.getItem('analytics-consent');
    
    if (consent === null) {
      // Show consent dialog
      this.enabled = await this.requestConsent();
    } else {
      this.enabled = consent === 'true';
    }
  }
  
  private async requestConsent(): Promise<boolean> {
    // Show UI asking for consent
    return new Promise((resolve) => {
      // ... show dialog
      // ... wait for user response
    });
  }
  
  track(event: string, data?: unknown): void {
    if (!this.enabled) return;
    
    // Send analytics
    console.log('Analytics:', event, data);
  }
}
```

### 2. Minimal Data Collection

```typescript
// Only collect what's necessary
interface AnalyticsEvent {
  event: string;
  timestamp: number;
  // NO personal information
  // NO IP addresses
  // NO device fingerprinting
}
```

---

## Security Headers

### Recommended Headers

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    headers: {
      // Prevent clickjacking
      'X-Frame-Options': 'DENY',
      
      // Prevent MIME sniffing
      'X-Content-Type-Options': 'nosniff',
      
      // Enable XSS protection
      'X-XSS-Protection': '1; mode=block',
      
      // Referrer policy
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // Permissions policy
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      
      // Content Security Policy (see above)
      'Content-Security-Policy': '...'
    }
  }
});
```

---

## Priority Action Items

1. **HIGH:** Add data integrity checking to StorageService
2. **HIGH:** Implement Content Security Policy
3. **MEDIUM:** Add resource limits and rate limiting
4. **MEDIUM:** Add input validation for all external data
5. **MEDIUM:** Implement game state validation
6. **LOW:** Add obfuscation for production builds
7. **LOW:** Add analytics consent mechanism

---

## Security Checklist

Before deploying:

- [ ] Content Security Policy configured
- [ ] All user input sanitized
- [ ] LocalStorage data integrity checked
- [ ] Resource limits in place
- [ ] Rate limiting implemented
- [ ] No eval() or Function() usage
- [ ] TypeScript strict mode enabled
- [ ] Security headers configured
- [ ] No sensitive data in client code
- [ ] Error messages don't leak information
- [ ] Dependencies are up to date
- [ ] No known vulnerabilities (run `npm audit`)

---

## Dependency Security

### Regular Audits

```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

### Use Dependabot

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

---

## Incident Response

### If Security Issue Found

1. **Assess Impact**
   - What data is affected?
   - How many users impacted?
   - Can it be exploited remotely?

2. **Immediate Actions**
   - Disable affected feature
   - Deploy hotfix
   - Notify users if necessary

3. **Post-Mortem**
   - Document the issue
   - Update security practices
   - Add tests to prevent recurrence

4. **Communication**
   - Be transparent
   - Provide timeline
   - Explain mitigation steps
