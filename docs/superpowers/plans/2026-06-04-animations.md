# DreamBouquet — Realistic Flower Animations (Sub-project B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the abstract ellipse petal canvas and add new realistic SVG blooming flowers (HeroGarden cascade + ScrollGarden) as a new `flowers.js` module.

**Architecture:** New `static/js/flowers.js` handles three systems — HeroGarden (cascaded SVG blooms in `#bloom-container`), ScrollGarden (8 fixed-position flowers in `#scroll-garden` that bloom on scroll via IntersectionObserver), and RealisticPetals (bezierCurveTo petals with physics on the existing `petals-canvas`). Only the abstract ellipse petal loop (main.js lines 99–153) is removed from `main.js`; all other animation code stays.

**Tech Stack:** Vanilla JS, SVG, CSS keyframes, IntersectionObserver, requestAnimationFrame, Canvas 2D bezierCurveTo

---

## File Map

| File | Change |
|------|--------|
| `static/js/main.js` | Remove lines 99–153 (abstract petal canvas loop only) |
| `static/js/flowers.js` | Create: HeroGarden + ScrollGarden + RealisticPetals |
| `static/css/style.css` | Add `.flower`, `.flower.blooming`, `.flower .petal`, `@keyframes petal-open` |
| `templates/base.html` | Add `<script src="flowers.js">` before `</body>` |
| `templates/index.html` | Add `<div id="scroll-garden">` before `{% endblock %}` |

---

## Task 1: Remove abstract petal canvas from main.js

**Files:**
- Modify: `static/js/main.js` (remove lines 99–153)

- [ ] **Step 1: Confirm exact lines to remove**

```bash
grep -n "FLOATING PETAL\|petals-canvas\|class Petal\|animPetals\|const petals" /mnt/c/ai/my-ai-assistant/website/static/js/main.js
```

Expected output shows: `const canvas = document.getElementById('petals-canvas')` around line 99 and `requestAnimationFrame(animPetals)` around line 152.

- [ ] **Step 2: Remove the petal canvas block**

Delete everything between and including these two lines (inclusive):
```
// ── FLOATING PETAL CANVAS ────────────────────────────────────
```
through:
```
})()   ← the closing of the animPetals IIFE (the one at line ~153)
```

The block to remove is:
```js
// ── FLOATING PETAL CANVAS ────────────────────────────────────
const canvas = document.getElementById('petals-canvas')
const ctx    = canvas.getContext('2d')

function resizeCanvas() { canvas.width = innerWidth; canvas.height = innerHeight }
resizeCanvas()
window.addEventListener('resize', resizeCanvas)

const PETAL_COLORS = [
  '#ff006e','#ff80ba','#ffb703','#ff4081','#f06292',
  '#ce93d8','#ffc8dd','#fff','#ea80fc','#ffab40',
]

class Petal {
  constructor() { this.reset(true) }
  reset(init = false) {
    this.x    = Math.random() * canvas.width
    this.y    = init ? Math.random() * canvas.height : -30
    this.size = 5 + Math.random() * 13
    this.vy   = 0.45 + Math.random() * 1.05
    this.vx   = (Math.random() - .5) * .8
    this.rot  = Math.random() * Math.PI * 2
    this.rotV = (Math.random() - .5) * .055
    this.alpha = .3 + Math.random() * .5
    this.color = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)]
    this.swayA = 16 + Math.random() * 26
    this.swayF = .012 + Math.random() * .018
    this.swayO = Math.random() * Math.PI * 2
  }
  update(t) {
    this.y += this.vy
    this.x += Math.sin(t * this.swayF + this.swayO) * .55 + this.vx
    this.rot += this.rotV
    if (this.y > canvas.height + 40) this.reset()
  }
  draw() {
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.rot)
    ctx.globalAlpha = this.alpha
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.ellipse(0, 0, this.size, this.size * .46, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

const petals = Array.from({ length: 70 }, () => new Petal())
let tick = 0
;(function animPetals() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  tick++
  petals.forEach(p => { p.update(tick); p.draw() })
  requestAnimationFrame(animPetals)
})()
```

- [ ] **Step 3: Verify the file still loads without errors**

```bash
cd /mnt/c/ai/my-ai-assistant/website && python -c "from app import app; print('OK')"
```

Expected: `OK`

- [ ] **Step 4: Verify petals-canvas section is gone**

```bash
grep -c "class Petal\|animPetals\|PETAL_COLORS" /mnt/c/ai/my-ai-assistant/website/static/js/main.js
```

Expected: `0`

- [ ] **Step 5: Commit**

```bash
git add static/js/main.js && git commit -m "feat: remove abstract petal canvas from main.js (replaced by flowers.js)"
```

---

## Task 2: Add CSS bloom animation classes to style.css

**Files:**
- Modify: `static/css/style.css`

- [ ] **Step 1: Add bloom CSS at the end of style.css**

Append to `/mnt/c/ai/my-ai-assistant/website/static/css/style.css`:

```css
/* ── Realistic Flower Bloom Animations ── */
.flower {
  position: absolute;
  pointer-events: none;
  overflow: visible;
}
.flower svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}
.flower .petal {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  transform: scaleY(0);
  opacity: 0;
}
.flower.blooming .petal {
  animation: petal-open 1.2s ease-out forwards;
}
@keyframes petal-open {
  0%   { transform: scaleY(0); opacity: 0; }
  35%  { transform: scaleY(1.1); opacity: 0.95; }
  65%  { transform: scaleY(0.97); opacity: 1; }
  100% { transform: scaleY(1); opacity: 1; }
}

/* scroll-garden container */
#scroll-garden {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}
```

- [ ] **Step 2: Verify brace balance**

```bash
python3 -c "
d = open('/mnt/c/ai/my-ai-assistant/website/static/css/style.css').read()
print('Brace diff:', d.count('{') - d.count('}'))
"
```

Expected: `0`

- [ ] **Step 3: Commit**

```bash
git add static/css/style.css && git commit -m "feat: add .flower bloom CSS animation classes"
```

---

## Task 3: Create flowers.js — SVG flower builders + HeroGarden

**Files:**
- Create: `static/js/flowers.js`

- [ ] **Step 1: Create flowers.js with SVG builders and HeroGarden**

Create `/mnt/c/ai/my-ai-assistant/website/static/js/flowers.js`:

```js
/* ═══════════════════════════════════════════════════════
   DREAM BOUQUET — REALISTIC FLOWER ANIMATIONS
   flowers.js — HeroGarden · ScrollGarden · RealisticPetals
   ═══════════════════════════════════════════════════════ */

// ── SVG FLOWER BUILDERS ──────────────────────────────────────

/**
 * Build a rose SVG string.
 * 5 outer petals (deep pink) + 3 inner petals (light pink) + gold centre.
 */
function makeRoseSVG(size) {
  const id = 'r' + Math.random().toString(36).slice(2, 7)
  const outerAngles = [0, 72, 144, 216, 288]
  const innerAngles = [36, 108, 180, 252, 324]

  // Outer wrapper handles rotation; inner .petal handles scale animation (avoids CSS transform conflict)
  const outerPetals = outerAngles.map((a, i) => `
    <g style="transform:rotate(${a}deg);transform-origin:0 0">
      <g class="petal" style="animation-delay:${i * 80}ms">
        <path d="M0,0 C-13,-9 -16,-32 0,-40 C16,-32 13,-9 0,0Z"
          fill="url(#og${id})" opacity="0.92"/>
      </g>
    </g>`).join('')

  const innerPetals = innerAngles.map((a, i) => `
    <g style="transform:rotate(${a}deg);transform-origin:0 0">
      <g class="petal" style="animation-delay:${(i * 80) + 200}ms">
        <path d="M0,0 C-9,-6 -11,-22 0,-28 C11,-22 9,-6 0,0Z"
          fill="url(#ig${id})" opacity="0.88"/>
      </g>
    </g>`).join('')

  return `<svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;width:${size}px;height:${size}px">
    <defs>
      <radialGradient id="og${id}" cx="50%" cy="80%">
        <stop offset="0%" stop-color="#FF6B8A"/>
        <stop offset="100%" stop-color="#E8175D"/>
      </radialGradient>
      <radialGradient id="ig${id}" cx="50%" cy="80%">
        <stop offset="0%" stop-color="#FFB6C1"/>
        <stop offset="100%" stop-color="#FF9BB5"/>
      </radialGradient>
    </defs>
    ${outerPetals}
    ${innerPetals}
    <circle cx="0" cy="0" r="7" fill="#FFD700" opacity="0.9"/>
    <circle cx="0" cy="0" r="3.5" fill="#FFF8DC" opacity="0.95"/>
  </svg>`
}

/**
 * Build a peony SVG string.
 * 8 wide outer petals + 5 narrow inner petals + dense centre.
 */
function makePeonySVG(size) {
  const id = 'p' + Math.random().toString(36).slice(2, 7)
  const outerAngles = [0, 45, 90, 135, 180, 225, 270, 315]
  const innerAngles = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5]

  const outerPetals = outerAngles.map((a, i) => `
    <g style="transform:rotate(${a}deg);transform-origin:0 0">
      <g class="petal" style="animation-delay:${i * 70}ms">
        <path d="M0,0 C-16,-8 -20,-28 0,-34 C20,-28 16,-8 0,0Z"
          fill="url(#og${id})" opacity="0.9"/>
      </g>
    </g>`).join('')

  const innerPetals = innerAngles.map((a, i) => `
    <g style="transform:rotate(${a}deg);transform-origin:0 0">
      <g class="petal" style="animation-delay:${(i * 70) + 300}ms">
        <path d="M0,0 C-10,-5 -12,-18 0,-22 C12,-18 10,-5 0,0Z"
          fill="url(#ig${id})" opacity="0.85"/>
      </g>
    </g>`).join('')

  return `<svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;width:${size}px;height:${size}px">
    <defs>
      <radialGradient id="og${id}" cx="50%" cy="80%">
        <stop offset="0%" stop-color="#E8C4F0"/>
        <stop offset="100%" stop-color="#C4A7E7"/>
      </radialGradient>
      <radialGradient id="ig${id}" cx="50%" cy="80%">
        <stop offset="0%" stop-color="#FFD4E8"/>
        <stop offset="100%" stop-color="#FFB6C1"/>
      </radialGradient>
    </defs>
    ${outerPetals}
    ${innerPetals}
    <circle cx="0" cy="0" r="9" fill="#FFF0F5" opacity="0.95"/>
    <circle cx="0" cy="0" r="4.5" fill="#FFD700" opacity="0.8"/>
  </svg>`
}

/**
 * Build a tulip SVG string.
 * 6 cupped petals (3 outer, 3 inner offset by 60°) + stamens.
 */
function makeTulipSVG(size) {
  const id = 't' + Math.random().toString(36).slice(2, 7)
  const outerAngles = [0, 120, 240]
  const innerAngles = [60, 180, 300]

  const outerPetals = outerAngles.map((a, i) => `
    <g style="transform:rotate(${a}deg);transform-origin:0 0">
      <g class="petal" style="animation-delay:${i * 100}ms">
        <path d="M0,0 C-14,-6 -17,-30 0,-44 C17,-30 14,-6 0,0Z"
          fill="url(#og${id})" opacity="0.9"/>
      </g>
    </g>`).join('')

  const innerPetals = innerAngles.map((a, i) => `
    <g style="transform:rotate(${a}deg);transform-origin:0 0">
      <g class="petal" style="animation-delay:${(i * 100) + 250}ms">
        <path d="M0,0 C-12,-5 -14,-26 0,-38 C14,-26 12,-5 0,0Z"
          fill="url(#ig${id})" opacity="0.88"/>
      </g>
    </g>`).join('')

  return `<svg viewBox="-50 -50 100 100" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;width:${size}px;height:${size}px">
    <defs>
      <radialGradient id="og${id}" cx="50%" cy="80%">
        <stop offset="0%" stop-color="#FFD580"/>
        <stop offset="100%" stop-color="#FFB347"/>
      </radialGradient>
      <radialGradient id="ig${id}" cx="50%" cy="80%">
        <stop offset="0%" stop-color="#FFF8CC"/>
        <stop offset="100%" stop-color="#FFE066"/>
      </radialGradient>
    </defs>
    ${outerPetals}
    ${innerPetals}
    <circle cx="0" cy="0" r="6" fill="#4CAF50" opacity="0.7"/>
    <circle cx="0" cy="0" r="3" fill="#81C784" opacity="0.9"/>
  </svg>`
}

// Factory — returns SVG string for given type and size
function makeFlowerSVGByType(type, size) {
  if (type === 'rose')   return makeRoseSVG(size)
  if (type === 'peony')  return makePeonySVG(size)
  if (type === 'tulip')  return makeTulipSVG(size)
  return makeRoseSVG(size)
}

// ── HERO GARDEN ──────────────────────────────────────────────
// Replaces abstract blooms in #bloom-container with realistic
// SVG flowers that cascade open one by one.
;(function initHeroGarden() {
  const container = document.getElementById('bloom-container')
  if (!container) return

  // Clear existing abstract blooms spawned by main.js
  container.innerHTML = ''

  const HERO_FLOWERS = [
    { type: 'rose',  size: 110, left: '8%',  top: '18%', delay: 0 },
    { type: 'peony', size: 90,  left: '82%', top: '12%', delay: 300 },
    { type: 'tulip', size: 80,  left: '48%', top: '70%', delay: 600 },
    { type: 'rose',  size: 70,  left: '18%', top: '65%', delay: 900 },
    { type: 'peony', size: 85,  left: '72%', top: '60%', delay: 1200 },
    { type: 'tulip', size: 65,  left: '90%', top: '80%', delay: 1500 },
  ]

  HERO_FLOWERS.forEach(cfg => {
    const el = document.createElement('div')
    el.className = 'flower'
    el.style.cssText = `
      left:${cfg.left};
      top:${cfg.top};
      width:${cfg.size}px;
      height:${cfg.size}px;
      opacity:0.55;
    `
    el.innerHTML = makeFlowerSVGByType(cfg.type, cfg.size)
    container.appendChild(el)

    setTimeout(() => {
      el.classList.add('blooming')
      const petals = el.querySelectorAll('.petal')
      const last = petals[petals.length - 1]
      if (last) {
        last.addEventListener('animationend', () => {
          el.classList.add('bloomed')
          petals.forEach(p => { p.style.willChange = 'auto' })
        }, { once: true })
        petals.forEach(p => { p.style.willChange = 'transform' })
      }
    }, cfg.delay)
  })
})()
```

- [ ] **Step 2: Verify file is created**

```bash
wc -l /mnt/c/ai/my-ai-assistant/website/static/js/flowers.js
```

Expected: ~130 lines

- [ ] **Step 3: Commit**

```bash
git add static/js/flowers.js && git commit -m "feat: flowers.js with SVG builders (rose/peony/tulip) + HeroGarden"
```

---

## Task 4: Implement ScrollGarden in flowers.js

**Files:**
- Modify: `static/js/flowers.js`

- [ ] **Step 1: Append ScrollGarden to flowers.js**

Append to the end of `/mnt/c/ai/my-ai-assistant/website/static/js/flowers.js`:

```js
// ── SCROLL GARDEN ────────────────────────────────────────────
// 8 fixed-position flowers around the page that bloom as user scrolls.
;(function initScrollGarden() {
  const container = document.getElementById('scroll-garden')
  if (!container) return

  const SCROLL_FLOWERS = [
    { type: 'rose',  size: 60, style: 'top:15%;left:2%'  },
    { type: 'peony', size: 55, style: 'top:30%;right:3%' },
    { type: 'tulip', size: 58, style: 'top:45%;left:1%'  },
    { type: 'rose',  size: 52, style: 'top:58%;right:4%' },
    { type: 'peony', size: 60, style: 'top:70%;left:3%'  },
    { type: 'tulip', size: 55, style: 'top:82%;right:2%' },
    { type: 'rose',  size: 50, style: 'top:90%;left:5%'  },
    { type: 'peony', size: 58, style: 'top:95%;right:5%' },
  ]

  SCROLL_FLOWERS.forEach(cfg => {
    const el = document.createElement('div')
    el.className = 'flower'
    el.style.cssText = cfg.style + ';width:' + cfg.size + 'px;height:' + cfg.size + 'px;opacity:0.4;'
    el.innerHTML = makeFlowerSVGByType(cfg.type, cfg.size)
    container.appendChild(el)
  })

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return
      const el = e.target
      el.querySelectorAll('.petal').forEach(p => { p.style.willChange = 'transform' })
      el.classList.add('blooming')
      const petals = el.querySelectorAll('.petal')
      const last = petals[petals.length - 1]
      if (last) {
        last.addEventListener('animationend', () => {
          el.classList.add('bloomed')
          petals.forEach(p => { p.style.willChange = 'auto' })
        }, { once: true })
      }
      observer.unobserve(el)
    })
  }, { threshold: 0.2, rootMargin: '0px 0px -50px 0px' })

  container.querySelectorAll('.flower').forEach(el => observer.observe(el))
})()
```

- [ ] **Step 2: Commit**

```bash
git add static/js/flowers.js && git commit -m "feat: add ScrollGarden to flowers.js"
```

---

## Task 5: Implement RealisticPetals in flowers.js

**Files:**
- Modify: `static/js/flowers.js`

- [ ] **Step 1: Append RealisticPetals to flowers.js**

Append to the end of `/mnt/c/ai/my-ai-assistant/website/static/js/flowers.js`:

```js
// ── REALISTIC PETAL CANVAS ───────────────────────────────────
// Replaces abstract ellipse petals with bezierCurveTo petal shapes,
// gradient fills, and realistic falling physics.
;(function initRealisticPetals() {
  const canvas = document.getElementById('petals-canvas')
  if (!canvas) return
  const ctx = canvas.getContext('2d')

  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
  resize()
  window.addEventListener('resize', resize)

  const PETAL_COLORS = [
    ['#FF9BB5', '#FF6B8A'],   // pink
    ['#FFFFFF', '#FFE0EC'],   // white
    ['#E8175D', '#FF4477'],   // red
    ['#D4B8F0', '#C4A7E7'],   // lavender
  ]

  const MAX_PETALS = window.innerWidth > 768 ? 18 : 10

  function createPetal(init) {
    const color = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)]
    return {
      x:          Math.random() * canvas.width,
      y:          init ? Math.random() * canvas.height : -20,
      vx:         (Math.random() - 0.5) * 0.5,
      vy:         1 + Math.random() * 1.5,
      rotation:   Math.random() * Math.PI * 2,
      rotSpeed:   (Math.random() - 0.5) * 0.04,
      wobble:     Math.random() * Math.PI * 2,
      wobbleSpeed:0.025 + Math.random() * 0.02,
      wobbleAmp:  15 + Math.random() * 15,
      opacity:    0.4 + Math.random() * 0.45,
      size:       8 + Math.random() * 8,
      color,
    }
  }

  function drawPetal(p) {
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rotation)
    ctx.globalAlpha = p.opacity

    const grad = ctx.createLinearGradient(0, -p.size, 0, p.size * 0.3)
    grad.addColorStop(0, p.color[0])
    grad.addColorStop(1, p.color[1])
    ctx.fillStyle = grad

    const s = p.size
    ctx.beginPath()
    ctx.moveTo(0, -s)
    ctx.bezierCurveTo( s * 0.7, -s * 0.6,  s * 0.9,  s * 0.1,  0,  s * 0.3)
    ctx.bezierCurveTo(-s * 0.9,  s * 0.1, -s * 0.7, -s * 0.6,  0, -s)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  function updatePetal(p) {
    p.wobble  += p.wobbleSpeed
    p.x       += p.vx + Math.sin(p.wobble) * 0.6
    p.y       += p.vy
    p.rotation += p.rotSpeed
    if (p.y > canvas.height + 30) {
      Object.assign(p, createPetal(false))
    }
  }

  const petals = Array.from({ length: MAX_PETALS }, () => createPetal(true))

  ;(function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    petals.forEach(p => { updatePetal(p); drawPetal(p) })
    requestAnimationFrame(loop)
  })()
})()
```

- [ ] **Step 2: Verify flowers.js line count**

```bash
wc -l /mnt/c/ai/my-ai-assistant/website/static/js/flowers.js
```

Expected: ~280–320 lines

- [ ] **Step 3: Commit**

```bash
git add static/js/flowers.js && git commit -m "feat: add RealisticPetals (bezierCurveTo + physics) to flowers.js"
```

---

## Task 6: Wire up base.html and index.html

**Files:**
- Modify: `templates/base.html`
- Modify: `templates/index.html`

- [ ] **Step 1: Add flowers.js script to base.html before `</body>`**

In `/mnt/c/ai/my-ai-assistant/website/templates/base.html`, find the line with `</body>` and insert before it:

```html
    <script src="{{ url_for('static', filename='js/flowers.js') }}"></script>
```

- [ ] **Step 2: Add scroll-garden div to index.html**

In `/mnt/c/ai/my-ai-assistant/website/templates/index.html`, find the line `{% endblock %}` at the very end (after the `{% block scripts %}` block) and insert BEFORE the final `{% endblock %}` of the `{% block content %}` block. 

Specifically, insert before the `{% block scripts %}` section:

```html
  {# ── SCROLL GARDEN (fixed-position blooming flowers) ── #}
  <div id="scroll-garden"></div>
```

- [ ] **Step 3: Verify app starts without errors**

```bash
cd /mnt/c/ai/my-ai-assistant/website && python -c "from app import app; print('OK')"
```

Expected: `OK`

- [ ] **Step 4: Verify flowers.js is referenced in base.html**

```bash
grep "flowers.js" /mnt/c/ai/my-ai-assistant/website/templates/base.html
```

Expected: one line with the script tag

- [ ] **Step 5: Verify scroll-garden exists in index.html**

```bash
grep "scroll-garden" /mnt/c/ai/my-ai-assistant/website/templates/index.html
```

Expected: one line with the div

- [ ] **Step 6: Commit**

```bash
git add templates/base.html templates/index.html && git commit -m "feat: wire up flowers.js and scroll-garden in templates"
```

---

## Task 7: Final verification

- [ ] **Step 1: Start app**

```bash
cd /mnt/c/ai/my-ai-assistant/website && python app.py &
sleep 3
```

- [ ] **Step 2: Verify homepage renders with both JS files**

```bash
curl -s http://localhost:5000/ | grep -c "flowers.js\|petals-canvas\|scroll-garden"
```

Expected: 3 (one for each)

- [ ] **Step 3: Verify petal class is gone from main.js**

```bash
grep -c "class Petal\|animPetals" /mnt/c/ai/my-ai-assistant/website/static/js/main.js
```

Expected: `0`

- [ ] **Step 4: Verify flowers.js has all three systems**

```bash
grep -c "initHeroGarden\|initScrollGarden\|initRealisticPetals" /mnt/c/ai/my-ai-assistant/website/static/js/flowers.js
```

Expected: `3`

- [ ] **Step 5: Verify CSS bloom classes exist**

```bash
grep -c "petal-open\|\.flower\.blooming\|scroll-garden" /mnt/c/ai/my-ai-assistant/website/static/css/style.css
```

Expected: `3`

- [ ] **Step 6: Kill server**

```bash
kill $(lsof -ti:5000) 2>/dev/null || true
```

- [ ] **Step 7: Final commit**

```bash
git add -A && git status
git diff --staged --quiet || git commit -m "feat: animations sub-project B complete — realistic blooming flowers + petal canvas"
```
