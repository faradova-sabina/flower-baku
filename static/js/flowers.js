/* ═══════════════════════════════════════════════════════
   DREAM BOUQUET — REALISTIC FLOWER ANIMATIONS
   flowers.js — HeroGarden · ScrollGarden · RealisticPetals
   ═══════════════════════════════════════════════════════ */

// ── SVG FLOWER BUILDERS ──────────────────────────────────────

function makeRoseSVG(size) {
  const id = 'r' + Math.random().toString(36).slice(2, 7)
  const outerAngles = [0, 72, 144, 216, 288]
  const innerAngles = [36, 108, 180, 252, 324]

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

function makeFlowerSVGByType(type, size) {
  if (type === 'rose')  return makeRoseSVG(size)
  if (type === 'peony') return makePeonySVG(size)
  if (type === 'tulip') return makeTulipSVG(size)
  return makeRoseSVG(size)
}

// ── HERO GARDEN ──────────────────────────────────────────────
;(function initHeroGarden() {
  const container = document.getElementById('bloom-container')
  if (!container) return

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
    el.style.cssText = `left:${cfg.left};top:${cfg.top};width:${cfg.size}px;height:${cfg.size}px;opacity:0.55;`
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
