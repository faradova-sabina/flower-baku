/* ═══════════════════════════════════════════════════════════
   DREAM BOUQUET — WOW BLOOM ANIMATION SYSTEM
   ═══════════════════════════════════════════════════════════ */

// ── INJECT GLOBAL KEYFRAMES ──────────────────────────────────
;(function() {
  const s = document.createElement('style')
  s.textContent = `
    @keyframes petal-bloom {
      0%   { transform: scaleX(0) scaleY(0); opacity: 0; }
      22%  { transform: scaleX(1.14) scaleY(1.14); opacity: 1; }
      68%  { transform: scaleX(1)    scaleY(1);    opacity: 0.95; }
      100% { transform: scaleX(0)   scaleY(0);    opacity: 0; }
    }
    @keyframes center-pulse {
      0%, 100% { transform: scale(1);    opacity: 1; }
      50%       { transform: scale(1.35); opacity: 0.85; }
    }
    @keyframes ring-expand {
      0%   { transform: scale(0.2); opacity: 0.9; }
      100% { transform: scale(3.5); opacity: 0; }
    }
    @keyframes cursor-bloom-in {
      0%   { transform: scale(0) rotate(0deg); opacity: 1; }
      60%  { transform: scale(1.1) rotate(20deg); opacity: 1; }
      100% { transform: scale(0.7) rotate(40deg); opacity: 0; }
    }
  `
  document.head.appendChild(s)
})()

// ── BLOOM COLOUR PALETTES ────────────────────────────────────
const PALETTES = [
  { outer: '#ff006e', inner: '#ff80ba', center: '#ffb703', glow: '#ff006e' },
  { outer: '#f50057', inner: '#ffc1e3', center: '#ffd600', glow: '#f50057' },
  { outer: '#e040fb', inner: '#ea80fc', center: '#fff176', glow: '#e040fb' },
  { outer: '#ff6d00', inner: '#ffab40', center: '#fff',    glow: '#ff6d00' },
  { outer: '#ffb703', inner: '#ffd54f', center: '#e8175d', glow: '#ffb703' },
  { outer: '#ff4081', inner: '#fce4ec', center: '#f50057', glow: '#ff4081' },
  { outer: '#d500f9', inner: '#ea80fc', center: '#ffeb3b', glow: '#d500f9' },
]

function randPalette() {
  return PALETTES[Math.floor(Math.random() * PALETTES.length)]
}

// ── BUILD SVG FLOWER ─────────────────────────────────────────
// Each petal is an ellipse anchored at the flower centre.
// transform-box:fill-box + transform-origin:bottom center → scales up from base.
function makeFlowerSVG(cfg, outerR = 22, innerR = 15, nPetals = 8) {
  let markup = ''

  // Outer petals
  for (let i = 0; i < nPetals; i++) {
    const angle = (360 / nPetals) * i
    const delay = (i * 0.085).toFixed(3)
    markup += `
      <g style="transform:rotate(${angle}deg);transform-origin:0 0">
        <ellipse cx="0" cy="${-outerR}" rx="${Math.round(outerR * 0.42)}" ry="${outerR}"
          fill="${cfg.outer}"
          style="transform-box:fill-box;transform-origin:bottom center;
                 animation:petal-bloom 3.8s ${delay}s ease-in-out infinite;
                 filter:drop-shadow(0 0 7px ${cfg.glow})"/>
      </g>`
  }

  // Inner petals (offset 22.5°, shorter, lighter)
  for (let i = 0; i < nPetals; i++) {
    const angle = (360 / nPetals) * i + (180 / nPetals)
    const delay = (i * 0.085 + 0.18).toFixed(3)
    markup += `
      <g style="transform:rotate(${angle}deg);transform-origin:0 0">
        <ellipse cx="0" cy="${-innerR}" rx="${Math.round(innerR * 0.45)}" ry="${innerR}"
          fill="${cfg.inner}"
          opacity="0.92"
          style="transform-box:fill-box;transform-origin:bottom center;
                 animation:petal-bloom 3.8s ${delay}s ease-in-out infinite"/>
      </g>`
  }

  // Glow ring
  markup += `
    <circle cx="0" cy="0" r="${Math.round(outerR * 0.55)}"
      fill="${cfg.glow}" opacity="0"
      style="animation:ring-expand 3.8s 0.3s ease-out infinite;transform-origin:center"/>`

  // Centre
  markup += `
    <circle cx="0" cy="0" r="${Math.round(outerR * 0.48)}"
      fill="${cfg.center}"
      style="filter:drop-shadow(0 0 9px ${cfg.center});
             animation:center-pulse 1.9s ease-in-out infinite;transform-origin:center"/>
    <circle cx="0" cy="0" r="${Math.round(outerR * 0.22)}" fill="#fff" opacity="0.82"/>`

  return `<svg viewBox="-55 -55 110 110" style="overflow:visible;width:100%;height:100%">${markup}</svg>`
}

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

// ── HERO BLOOMS ──────────────────────────────────────────────
function spawnHeroBloom(container) {
  const pal  = randPalette()
  const size = 55 + Math.random() * 90          // 55–145 px
  const dur  = 4.2 + Math.random() * 3.5        // 4.2–7.7 s
  const del  = Math.random() * 5                // stagger up to 5 s

  const div  = document.createElement('div')
  div.className = 'bloom'
  div.style.cssText = `
    position:absolute;
    left:${3 + Math.random() * 94}%;
    top:${3 + Math.random() * 94}%;
    width:${size}px; height:${size}px;
    animation-duration:${dur}s;
    animation-delay:${del}s;
  `
  div.innerHTML = makeFlowerSVG(pal, Math.round(size * 0.42), Math.round(size * 0.28))
  container.appendChild(div)
}

const heroContainer = document.getElementById('bloom-container')
if (heroContainer) {
  for (let i = 0; i < 20; i++) spawnHeroBloom(heroContainer)
}

// ── CARD HOVER BLOOM ─────────────────────────────────────────
document.querySelectorAll('[data-bloom]').forEach(el => {
  const pal  = randPalette()
  const wrap = document.createElement('div')
  wrap.style.cssText = `
    width:100px; height:100px;
    transform:scale(0);
    transition:transform .45s cubic-bezier(.34,1.56,.64,1);
  `
  wrap.innerHTML = makeFlowerSVG(pal, 28, 18, 8)
  el.appendChild(wrap)

  const card = el.closest('.offer-card')
  if (card) {
    card.addEventListener('mouseenter', () => { wrap.style.transform = 'scale(1)' })
    card.addEventListener('mouseleave', () => { wrap.style.transform = 'scale(0)' })
  }
})

// ── SECTION SCROLL BLOOMS ────────────────────────────────────
// When a card enters view, briefly spawn a glow behind it
const scrollBloomObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return
    const card = e.target
    const pal  = randPalette()

    const b = document.createElement('div')
    b.style.cssText = `
      position:absolute; top:50%; left:50%;
      transform:translate(-50%,-50%) scale(0);
      width:140px; height:140px; pointer-events:none; z-index:0;
      transition:transform .6s cubic-bezier(.34,1.56,.64,1), opacity .6s;
    `
    b.innerHTML = makeFlowerSVG(pal, 38, 24, 8)
    card.style.position = 'relative'
    card.appendChild(b)

    requestAnimationFrame(() => {
      b.style.transform = 'translate(-50%,-50%) scale(1)'
      b.style.opacity = '0.22'
    })
    setTimeout(() => {
      b.style.transform = 'translate(-50%,-50%) scale(0)'
      b.style.opacity = '0'
      setTimeout(() => b.remove(), 700)
    }, 1200)

    scrollBloomObserver.unobserve(card)
  })
}, { threshold: 0.3 })

document.querySelectorAll('.offer-card').forEach(c => scrollBloomObserver.observe(c))

// ── CURSOR BLOOM TRAIL ───────────────────────────────────────
let lastCursorBloom = 0
document.addEventListener('mousemove', (e) => {
  const now = Date.now()
  if (now - lastCursorBloom < 420) return  // throttle ~2/s
  lastCursorBloom = now

  const pal  = randPalette()
  const size = 32 + Math.random() * 24
  const div  = document.createElement('div')
  div.style.cssText = `
    position:fixed;
    left:${e.clientX - size / 2}px;
    top:${e.clientY - size / 2}px;
    width:${size}px; height:${size}px;
    pointer-events:none; z-index:9999;
    animation:cursor-bloom-in .85s ease-out forwards;
  `
  div.innerHTML = makeFlowerSVG(pal, Math.round(size * 0.38), Math.round(size * 0.25), 6)
  document.body.appendChild(div)
  setTimeout(() => div.remove(), 900)
})

// ── SCROLL REVEAL ────────────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 75)
      revealObserver.unobserve(e.target)
    }
  })
}, { threshold: 0.1 })
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el))

// ── COUNTER ANIMATION ────────────────────────────────────────
function animCounter(el) {
  const target = +el.dataset.target
  const label  = el.closest('.stat')?.querySelector('.stat-label')?.textContent || ''
  const isMin  = label.toLowerCase().includes('min')
  const step   = target / (1800 / 16)
  let cur      = 0
  const t      = setInterval(() => {
    cur = Math.min(cur + step, target)
    el.textContent = Math.floor(cur).toLocaleString('en') + (isMin ? ' min' : '+')
    if (cur >= target) clearInterval(t)
  }, 16)
}

const counterObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { animCounter(e.target); counterObs.unobserve(e.target) }
  })
}, { threshold: 0.5 })
document.querySelectorAll('[data-target]').forEach(el => counterObs.observe(el))

// ── PAYMENT SANDBOX ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('[data-pay-sandbox]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault()
      try {
        const resp = await fetch('/pay_sandbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: btn.dataset.order,
        })
        const data = await resp.json()
        if (data.status === 'ok') {
          window.location.href = '/confirmation_paid?order_id=' + encodeURIComponent(data.order_id)
        } else {
          alert('Ошибка оплаты: ' + (data.error || 'неизвестная ошибка'))
        }
      } catch {
        alert('Ошибка сети при оплате')
      }
    })
  })
})

// ── STICKY HEADER SCROLL EFFECT ─────────────────────────────
;(function () {
  const header = document.getElementById('header-inner')
  if (!header) return
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 60)
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()  // run once in case page is loaded mid-scroll
})()

// ── MOBILE HAMBURGER MENU ────────────────────────────────────
;(function () {
  const btn     = document.getElementById('nav-hamburger')
  const overlay = document.getElementById('nav-overlay')
  const closeBtn= document.getElementById('nav-overlay-close')
  if (!btn || !overlay) return

  function openMenu() {
    overlay.classList.add('open')
    btn.classList.add('open')
    btn.setAttribute('aria-expanded', 'true')
    overlay.setAttribute('aria-hidden', 'false')
    document.body.style.overflow = 'hidden'
  }
  function closeMenu() {
    overlay.classList.remove('open')
    btn.classList.remove('open')
    btn.setAttribute('aria-expanded', 'false')
    overlay.setAttribute('aria-hidden', 'true')
    document.body.style.overflow = ''
  }

  btn.addEventListener('click', () => overlay.classList.contains('open') ? closeMenu() : openMenu())
  closeBtn?.addEventListener('click', closeMenu)

  // Close on link click or Escape
  overlay.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu))
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu() })
})()

// ── GLOBAL FLOATING REALISTIC FLOWERS ───────────────────────
;(function() {
  const FLOWER_TYPES = [
    // Rose — layered petals
    (col) => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="rg${Math.random().toString(36).slice(2)}" cx="50%" cy="60%">
          <stop offset="0%" stop-color="${lighten(col,0.4)}"/>
          <stop offset="100%" stop-color="${darken(col,0.2)}"/>
        </radialGradient>
      </defs>
      ${[0,72,144,216,288].map(a => petalPath(50,50,a,38,28,col)).join('')}
      ${[36,108,180,252,324].map(a => petalPath(50,50,a,28,20,lighten(col,0.15))).join('')}
      ${[0,90,180,270].map(a => petalPath(50,50,a,18,12,darken(col,0.1))).join('')}
      <circle cx="50" cy="50" r="7" fill="${darken(col,0.3)}"/>
      <circle cx="50" cy="50" r="3.5" fill="${lighten(col,0.6)}" opacity="0.8"/>
    </svg>`,
    // Peony — fluffy
    (col) => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      ${[...Array(16)].map((_,i) => petalPath(50,50,i*22.5,36,14,i<8?col:lighten(col,0.2))).join('')}
      ${[...Array(10)].map((_,i) => petalPath(50,50,i*36,24,10,lighten(col,0.3))).join('')}
      ${[...Array(6)].map((_,i) => petalPath(50,50,i*60,14,7,lighten(col,0.5))).join('')}
      <circle cx="50" cy="50" r="5" fill="${lighten(col,0.7)}"/>
    </svg>`,
    // Daisy — long thin petals
    (col) => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      ${[...Array(14)].map((_,i) => petalPath(50,50,i*(360/14),40,8,col)).join('')}
      <circle cx="50" cy="50" r="12" fill="#f5cc30"/>
      <circle cx="50" cy="50" r="7" fill="#e8a800"/>
      ${[...Array(8)].map((_,i)=>`<circle cx="${50+Math.cos(i/8*Math.PI*2)*5}" cy="${50+Math.sin(i/8*Math.PI*2)*5}" r="1.5" fill="#c07000" opacity="0.7"/>`).join('')}
    </svg>`,
  ]

  function petalPath(cx, cy, angleDeg, len, wid, color) {
    const a = angleDeg * Math.PI / 180
    const tipX = cx + Math.cos(a - Math.PI/2) * len
    const tipY = cy + Math.sin(a - Math.PI/2) * len
    const lx   = cx + Math.cos(a - Math.PI/2 - 0.7) * len * 0.65
    const ly   = cy + Math.sin(a - Math.PI/2 - 0.7) * len * 0.65
    const rx   = cx + Math.cos(a - Math.PI/2 + 0.7) * len * 0.65
    const ry   = cy + Math.sin(a - Math.PI/2 + 0.7) * len * 0.65
    const bl   = cx + Math.cos(a + Math.PI/2 - 0.4) * wid * 0.7
    const bly  = cy + Math.sin(a + Math.PI/2 - 0.4) * wid * 0.7
    const br   = cx + Math.cos(a + Math.PI/2 + 0.4) * (-wid * 0.7) + cx * 0 + (cx - bl + cx)
    const bry  = bly
    return `<path d="M${cx},${cy} C${lx},${ly} ${tipX-(tipX-cx)*0.1},${tipY-(tipY-cy)*0.1} ${tipX},${tipY} C${rx},${ry} ${cx+Math.cos(a+Math.PI/2)*wid*0.5},${cy+Math.sin(a+Math.PI/2)*wid*0.5} ${cx},${cy}Z" fill="${color}" opacity="0.92"/>`
  }

  function lighten(hex, amt) {
    const n = parseInt(hex.replace('#',''), 16)
    const r = Math.min(255, (n>>16) + Math.round(amt*255))
    const g = Math.min(255, ((n>>8)&0xff) + Math.round(amt*255))
    const b = Math.min(255, (n&0xff) + Math.round(amt*255))
    return `rgb(${r},${g},${b})`
  }
  function darken(hex, amt) {
    const n = parseInt(hex.replace('#',''), 16)
    const r = Math.max(0, (n>>16) - Math.round(amt*255))
    const g = Math.max(0, ((n>>8)&0xff) - Math.round(amt*255))
    const b = Math.max(0, (n&0xff) - Math.round(amt*255))
    return `rgb(${r},${g},${b})`
  }

  const COLORS = ['#e8175d','#f48fb1','#ff6d00','#ffb703','#9c27b0','#fff','#ce93d8']

  function spawnGlobalFlower() {
    const col  = COLORS[Math.floor(Math.random() * COLORS.length)]
    const type = FLOWER_TYPES[Math.floor(Math.random() * FLOWER_TYPES.length)]
    const size = 30 + Math.random() * 55
    const dur  = 12 + Math.random() * 18
    const del  = Math.random() * 6
    const x    = 2 + Math.random() * 96

    const el = document.createElement('div')
    el.className = 'global-flower'
    el.style.cssText = `
      left:${x}%;
      bottom:-${size + 20}px;
      width:${size}px;
      height:${size}px;
      animation-duration:${dur}s;
      animation-delay:${del}s;
      opacity:0.18;
    `
    el.innerHTML = type(col)
    document.getElementById('bloom-global-layer')?.appendChild(el)
    setTimeout(() => el.remove(), (dur + del) * 1000 + 500)
  }

  const layer = document.getElementById('bloom-global-layer')
  if (layer) {
    for (let i = 0; i < 8; i++) spawnGlobalFlower()
    setInterval(spawnGlobalFlower, 2800)
  }
})()

// ── HERO REALISTIC BLOOMING FLOWERS ─────────────────────────
;(function() {
  const container = document.getElementById('hero-flowers')
  if (!container) return

  // Detailed SVG rose that "blooms" open on render
  function makeDetailedRose(color, size) {
    const id = 'rose' + Math.random().toString(36).slice(2)
    return `<svg id="${id}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">
      <defs>
        <radialGradient id="g${id}" cx="50%" cy="50%">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.95"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0.6"/>
        </radialGradient>
        <filter id="f${id}" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      <!-- Outer petals -->
      ${[0,60,120,180,240,300].map((a,i) => {
        const rad = a * Math.PI/180
        const px = 100 + Math.cos(rad) * 62, py = 100 + Math.sin(rad) * 62
        return `<ellipse cx="${px}" cy="${py}" rx="28" ry="42"
          transform="rotate(${a},${px},${py})"
          fill="url(#g${id})" opacity="0.88"
          style="transform-origin:${px}px ${py}px;
                 animation:petal-bloom 4s ${i*0.15}s ease-in-out infinite alternate"/>`
      }).join('')}
      <!-- Mid petals -->
      ${[30,90,150,210,270,330].map((a,i) => {
        const rad = a * Math.PI/180
        const px = 100 + Math.cos(rad) * 40, py = 100 + Math.sin(rad) * 40
        return `<ellipse cx="${px}" cy="${py}" rx="20" ry="32"
          transform="rotate(${a},${px},${py})"
          fill="${color}" opacity="0.82"
          style="transform-origin:${px}px ${py}px;
                 animation:petal-bloom 4s ${0.9+i*0.12}s ease-in-out infinite alternate"/>`
      }).join('')}
      <!-- Inner petals -->
      ${[0,72,144,216,288].map((a,i) => {
        const rad = a * Math.PI/180
        const px = 100 + Math.cos(rad) * 22, py = 100 + Math.sin(rad) * 22
        return `<ellipse cx="${px}" cy="${py}" rx="13" ry="20"
          transform="rotate(${a},${px},${py})"
          fill="${color}" opacity="0.9"
          style="transform-origin:${px}px ${py}px;
                 animation:petal-bloom 4s ${1.6+i*0.1}s ease-in-out infinite alternate"/>`
      }).join('')}
      <circle cx="100" cy="100" r="14" fill="#ffdd44" filter="url(#f${id})" opacity="0.95"/>
      <circle cx="100" cy="100" r="7" fill="#fff" opacity="0.85"/>
    </svg>`
  }

  const HERO_FLOWERS = [
    { color: '#e8175d', x: 8,  y: 20, size: 110, dur: 6,   del: 0 },
    { color: '#f48fb1', x: 88, y: 15, size: 90,  dur: 7.5, del: 1.2 },
    { color: '#fff',    x: 50, y: 72, size: 70,  dur: 5.5, del: 0.6 },
    { color: '#ffb703', x: 18, y: 65, size: 80,  dur: 8,   del: 2 },
    { color: '#ce93d8', x: 78, y: 58, size: 85,  dur: 6.5, del: 0.9 },
    { color: '#e8175d', x: 92, y: 82, size: 60,  dur: 7,   del: 1.5 },
    { color: '#f48fb1', x: 5,  y: 82, size: 65,  dur: 9,   del: 2.5 },
  ]

  HERO_FLOWERS.forEach(f => {
    const div = document.createElement('div')
    div.className = 'hero-flower-svg'
    div.style.cssText = `
      left:${f.x}%;
      top:${f.y}%;
      width:${f.size}px;
      height:${f.size}px;
      animation-duration:${f.dur}s;
      animation-delay:${f.del}s;
      opacity:0.35;
    `
    div.innerHTML = makeDetailedRose(f.color, f.size)
    container.appendChild(div)
  })
})()

// ── NO-OFFERS ANIMATED FLOWER ────────────────────────────────
;(function() {
  const wrap = document.getElementById('no-offers-flower')
  if (!wrap) return

  wrap.innerHTML = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" style="width:120px;height:120px;overflow:visible">
    <defs>
      <style>
        .no-p { transform-origin: 60px 60px; animation: no-petal-open 2.5s ease-out forwards; }
        @keyframes no-petal-open {
          from { transform: scaleY(0) rotate(var(--r)); }
          to   { transform: scaleY(1) rotate(var(--r)); }
        }
      </style>
    </defs>
    ${[0,51.4,102.8,154.2,205.7,257.1,308.5].map((a,i)=>
      `<ellipse class="no-p" cx="${60+Math.cos(a*Math.PI/180)*30}" cy="${60+Math.sin(a*Math.PI/180)*30}"
       rx="14" ry="22" fill="#e8175d" opacity="0.75"
       style="--r:${a}deg;animation-delay:${i*0.12}s"/>`
    ).join('')}
    <circle cx="60" cy="60" r="16" fill="#ffdd44" style="animation:center-pulse 2s 1s ease-in-out infinite"/>
    <circle cx="60" cy="60" r="8" fill="#fff" opacity="0.9"/>
  </svg>`
})()

// ── SCROLL SPY ───────────────────────────────────────────────
;(function () {
  const allNavLinks = document.querySelectorAll(
    '.nav a[data-section], .nav-overlay a[data-section]'
  )
  if (!allNavLinks.length) return

  const sectionIds = [...new Set([...allNavLinks].map(a => a.dataset.section))]

  function setActive(id) {
    allNavLinks.forEach(a => {
      a.classList.toggle('nav-active', a.dataset.section === id)
    })
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) setActive(e.target.id)
    })
  }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 })

  sectionIds.forEach(id => {
    const el = document.getElementById(id)
    if (el) obs.observe(el)
  })
})()

// ── OCCASION FILTER TABS ─────────────────────────────────────
;(function () {
  const tabs  = document.querySelectorAll('.occasion-card')
  const cards = document.querySelectorAll('#offers-grid .offer-card')
  if (!tabs.length) return

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'))
      tab.classList.add('active')

      const occ = tab.dataset.occasion
      let visible = 0
      cards.forEach(card => {
        const cardOcc = card.dataset.occasion || ''
        const show = occ === 'all' || cardOcc.split(',').includes(occ)
        card.style.display = show ? '' : 'none'
        if (show) visible++
      })

      // Update URL without reload for shareability
      const url = new URL(window.location)
      if (occ === 'all') url.searchParams.delete('occasion')
      else url.searchParams.set('occasion', occ)
      window.history.replaceState({}, '', url)
    })
  })
})()

// ── QUESTIONNAIRE ────────────────────────────────────────────
;(function () {
  const TOTAL_STEPS = 5
  let currentStep   = 1
  const answers     = {}

  const stepLabel   = document.getElementById('quiz-step-label')
  const progressBar = document.getElementById('quiz-progress-bar')
  const backBtn     = document.getElementById('quiz-back')
  const nextBtn     = document.getElementById('quiz-next')
  const submitBtn   = document.getElementById('quiz-submit')
  const resultsEl   = document.getElementById('quiz-results')
  const resultsGrid = document.getElementById('quiz-results-grid')
  const resetBtn    = document.getElementById('quiz-reset')
  const quizCard    = document.querySelector('.quiz-card')

  if (!stepLabel) return  // not on index page

  function getStepEl(n) {
    return document.querySelector(`.quiz-step[data-step="${n}"]`)
  }

  function showStep(n) {
    document.querySelectorAll('.quiz-step').forEach(s => s.classList.remove('active'))
    getStepEl(n).classList.add('active')

    stepLabel.textContent  = `Шаг ${n} из ${TOTAL_STEPS}`
    progressBar.style.width = (n / TOTAL_STEPS * 100) + '%'

    backBtn.style.display   = n > 1 ? '' : 'none'
    nextBtn.style.display   = n < TOTAL_STEPS ? '' : 'none'
    submitBtn.style.display = n === TOTAL_STEPS ? '' : 'none'

    refreshNextState(n)
  }

  function refreshNextState(n) {
    const field = getStepEl(n)?.querySelector('[data-field]')?.dataset.field
    const hasAnswer = field && answers[field]
    nextBtn.disabled   = !hasAnswer
    submitBtn.disabled = !hasAnswer
  }

  // Chip selection
  document.querySelectorAll('.quiz-chips').forEach(group => {
    group.querySelectorAll('.quiz-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        group.querySelectorAll('.quiz-chip').forEach(c => c.classList.remove('selected'))
        chip.classList.add('selected')
        answers[group.dataset.field] = chip.dataset.value
        refreshNextState(currentStep)
      })
    })
  })

  backBtn?.addEventListener('click', () => {
    if (currentStep > 1) { currentStep--; showStep(currentStep) }
  })

  nextBtn?.addEventListener('click', () => {
    if (currentStep < TOTAL_STEPS) { currentStep++; showStep(currentStep) }
  })

  submitBtn?.addEventListener('click', () => {
    runRecommendation()
  })

  resetBtn?.addEventListener('click', () => {
    answers.for_whom = answers.occasion = answers.age_range = answers.budget = answers.flowers = undefined
    document.querySelectorAll('.quiz-chip').forEach(c => c.classList.remove('selected'))
    document.querySelectorAll('.offer-card').forEach(c => {
      c.classList.remove('quiz-match', 'quiz-top-match')
    })
    resultsEl.style.display = 'none'
    quizCard.style.display  = ''
    currentStep = 1
    showStep(1)
  })

  function scoreOffer(offer, ans) {
    let s = 0
    const occ      = ans.occasion  || ''
    const forWhom  = ans.for_whom  || ''
    const ageRange = ans.age_range || ''
    const budget   = parseInt(ans.budget || '9999')
    const flowers  = ans.flowers   || ''

    if (occ && Array.isArray(offer.occasion) && offer.occasion.includes(occ))              s += 40
    if (forWhom && Array.isArray(offer.for_whom) && offer.for_whom.includes(forWhom))       s += 25
    if (ageRange && Array.isArray(offer.age_range) && offer.age_range.includes(ageRange))   s += 15

    const price = offer.price || 9999
    if (price <= budget) {
      s += 20
      if (price >= budget * 0.6) s += 8   // sweet-spot bonus
    } else {
      s -= 20
    }

    if (flowers && flowers !== 'any') {
      const comp = (offer.composition || []).join(' ').toLowerCase()
      if (comp.includes(flowers.toLowerCase())) s += 15
    }

    return s
  }

  function runRecommendation() {
    const allOffers = window.ALL_OFFERS || []
    const scored = allOffers
      .map(o => ({ ...o, _score: scoreOffer(o, answers) }))
      .sort((a, b) => b._score - a._score)
      .slice(0, 3)

    // Hide quiz card, show results
    quizCard.style.display  = 'none'
    resultsEl.style.display = ''
    resultsGrid.innerHTML   = ''

    scored.forEach((offer, idx) => {
      const card = document.createElement('a')
      card.href  = '/order/' + offer.id
      card.className = 'quiz-result-card' + (idx === 0 ? ' best-match' : '')
      card.innerHTML = `
        <img class="quiz-result-img" src="${offer.photo || ''}" alt="${offer.title}" loading="lazy">
        <div class="quiz-result-body">
          <div class="quiz-result-name">${offer.title}</div>
          <div class="quiz-result-delivery">⏱️ ${offer.delivery_time || ''}</div>
          <div class="quiz-result-price">${offer.price}₼</div>
          <div class="quiz-result-delivery">⏱️ ${offer.delivery_time || ''}</div>
        </div>
      `
      resultsGrid.appendChild(card)
    })

    // Also highlight matching cards in main catalog
    const topId  = scored[0]?.id
    const matchIds = scored.map(o => o.id)
    document.querySelectorAll('#offers-grid .offer-card').forEach(card => {
      const id = card.dataset.id
      card.classList.remove('quiz-match', 'quiz-top-match')
      if (id === topId)            card.classList.add('quiz-top-match')
      else if (matchIds.includes(id)) card.classList.add('quiz-match')
    })

    // Smooth scroll to results
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Init
  showStep(1)
})()
