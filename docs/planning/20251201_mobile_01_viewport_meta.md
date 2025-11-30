# Task 1: Viewport & Meta Configuration

**Date:** December 1, 2025  
**Priority:** Critical  
**Estimated Time:** 30 minutes  
**Dependencies:** None

## Objective

Configure HTML meta tags and CSS to properly support mobile browsers, prevent unwanted zooming, and establish responsive viewport behavior.

## Current State

```html
<!-- index.html -->
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

Basic viewport tag exists but lacks mobile-specific optimizations.

## Required Changes

### 1. Enhanced Viewport Meta Tag

**File:** `index.html`

Update the viewport meta tag with mobile-optimized settings:

```html
<meta 
  name="viewport" 
  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
/>
```

**Explanation:**
- `maximum-scale=1.0` - Prevents pinch-to-zoom (game controls, not document)
- `user-scalable=no` - Disables double-tap zoom
- `viewport-fit=cover` - Handles iPhone notch/safe areas

### 2. Mobile-Specific Meta Tags

**File:** `index.html`

Add these meta tags in the `<head>` section:

```html
<!-- Prevent iOS Safari from adding phone number links -->
<meta name="format-detection" content="telephone=no" />

<!-- iOS Web App Capable -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-fullscreen" />
<meta name="apple-mobile-web-app-title" content="Kobayashi Maru" />

<!-- Android Chrome Theme Color -->
<meta name="theme-color" content="#000000" />

<!-- Prevent text size adjustment on orientation change -->
<meta name="mobile-web-app-capable" content="yes" />
```

### 3. Touch Action CSS

**File:** `index.html` (inline styles) or `src/style.css`

Add CSS to prevent default touch behaviors:

```css
html, body {
  /* Existing styles */
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #000000;
  
  /* Mobile-specific additions */
  touch-action: none; /* Prevent default touch behaviors like pull-to-refresh */
  -webkit-touch-callout: none; /* Disable iOS callout menu */
  -webkit-user-select: none; /* Prevent text selection */
  user-select: none;
  -webkit-tap-highlight-color: transparent; /* Remove tap highlight */
  overscroll-behavior: none; /* Prevent overscroll bounce */
}

#app {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  
  /* Mobile-specific additions */
  touch-action: none;
  position: fixed; /* Prevent address bar issues */
  top: 0;
  left: 0;
}

canvas {
  display: block;
  touch-action: none; /* Critical for touch input */
  outline: none; /* Remove focus outline */
}
```

### 4. Safe Area Support (iOS Notch)

**File:** `src/style.css`

Add CSS variables for safe areas:

```css
:root {
  /* Safe area insets for iOS notch/home indicator */
  --safe-area-inset-top: env(safe-area-inset-top, 0px);
  --safe-area-inset-right: env(safe-area-inset-right, 0px);
  --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-inset-left: env(safe-area-inset-left, 0px);
}

body {
  /* Apply safe area padding */
  padding-top: var(--safe-area-inset-top);
  padding-right: var(--safe-area-inset-right);
  padding-bottom: var(--safe-area-inset-bottom);
  padding-left: var(--safe-area-inset-left);
}
```

### 5. Prevent iOS Bounce/Rubber-Band Effect

**File:** `src/main.ts`

Add JavaScript to prevent iOS scroll bounce:

```typescript
// Prevent iOS bounce/rubber-band scrolling
document.addEventListener('touchmove', (e) => {
  if (e.touches.length > 1) {
    // Allow multi-touch for gestures
    return;
  }
  e.preventDefault();
}, { passive: false });

// Prevent iOS double-tap zoom
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    e.preventDefault();
  }
  lastTouchEnd = now;
}, { passive: false });
```

## Implementation Steps

1. **Update index.html**
   - Modify viewport meta tag
   - Add mobile-specific meta tags
   - Update inline styles or link to updated CSS

2. **Update src/style.css**
   - Add touch-action properties
   - Add safe area CSS variables
   - Add mobile-specific CSS rules

3. **Update src/main.ts**
   - Add touch event prevention code
   - Add double-tap zoom prevention

4. **Test on Mobile Devices**
   - Test on iOS Safari (iPhone)
   - Test on Android Chrome
   - Verify no unwanted zoom/scroll
   - Check safe area handling on notched devices

## Testing Checklist

- [ ] Page loads without zoom on mobile
- [ ] Cannot pinch-to-zoom
- [ ] Cannot double-tap to zoom
- [ ] No pull-to-refresh on iOS
- [ ] No overscroll bounce
- [ ] Safe areas respected on iPhone with notch
- [ ] Canvas fills viewport correctly
- [ ] No text selection when touching UI
- [ ] No tap highlight flashes

## Success Criteria

- Game viewport properly sized on all mobile devices
- No unwanted browser behaviors (zoom, scroll, bounce)
- Safe areas properly handled on iOS devices
- Canvas ready to receive touch input
- No visual artifacts or layout issues

## Notes for Agent

- This task is purely HTML/CSS/basic JS
- No game logic changes required
- Focus on preventing default browser behaviors
- Test on real devices if possible (use browser dev tools mobile emulation as fallback)
- Ensure changes don't break desktop experience

## Related Files

- `index.html` - Main HTML file
- `src/style.css` - Global styles
- `src/main.ts` - Main entry point

## Next Task

After completing this task, proceed to **Task 2: Touch Input Manager** to handle touch events in the game.
