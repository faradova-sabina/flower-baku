/* ═══════════════════════════════════════════════════════
   DREAM BOUQUET — REALISTIC FLOWER ANIMATIONS
   flowers.js — HeroGarden · ScrollGarden · RealisticPetals
   ═══════════════════════════════════════════════════════ */

// ── FLOWER BUILDERS (real photo-based) ──────────────────────

// Use real flower photos for realistic animations
function makeFlowerImg(type, size) {
  const URLS = {
    rose:  '/static/images/flowers/rose.jpg',
    peony: '/static/images/flowers/peony.jpg',
    tulip: '/static/images/flowers/tulip.jpg',
  };
  const url = URLS[type] || URLS.rose;
  return `<img src="${url}" alt="${type}"
    style="width:${size}px;height:${size}px;
           object-fit:cover;
           border-radius:50%;
           opacity:0.75;
           filter:brightness(1.1) saturate(1.2);"
    draggable="false">`;
}

function makeFlowerSVGByType(type, size) {
  return makeFlowerImg(type, size);
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
      el.style.willChange = 'transform, opacity'
      el.classList.add('blooming')
      el.addEventListener('animationend', () => {
        el.classList.add('bloomed')
        el.style.willChange = 'auto'
      }, { once: true })
    }, cfg.delay)
  })
})()

// ── SCROLL GARDEN ────────────────────────────────────────────
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
      el.style.willChange = 'transform, opacity'
      el.classList.add('blooming')
      el.addEventListener('animationend', () => {
        el.classList.add('bloomed')
        el.style.willChange = 'auto'
      }, { once: true })
      observer.unobserve(el)
    })
  }, { threshold: 0.2, rootMargin: '0px 0px -50px 0px' })

  container.querySelectorAll('.flower').forEach(el => observer.observe(el))
})()

// ── REALISTIC PETAL CANVAS ───────────────────────────────────
;(function initRealisticPetals() {
  const canvas = document.getElementById('petals-canvas')
  if (!canvas) return
  const ctx = canvas.getContext('2d')

  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
  resize()
  window.addEventListener('resize', resize)

  const PETAL_COLORS = [
    ['#FF9BB5', '#FF6B8A'],
    ['#FFFFFF', '#FFE0EC'],
    ['#E8175D', '#FF4477'],
    ['#D4B8F0', '#C4A7E7'],
  ]

  const MAX_PETALS = window.innerWidth > 768 ? 18 : 10

  function createPetal(init) {
    const color = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)]
    return {
      x:           Math.random() * canvas.width,
      y:           init ? Math.random() * canvas.height : -20,
      vx:          (Math.random() - 0.5) * 0.5,
      vy:          1 + Math.random() * 1.5,
      rotation:    Math.random() * Math.PI * 2,
      rotSpeed:    (Math.random() - 0.5) * 0.04,
      wobble:      Math.random() * Math.PI * 2,
      wobbleSpeed: 0.025 + Math.random() * 0.02,
      wobbleAmp:   15 + Math.random() * 15,
      opacity:     0.4 + Math.random() * 0.45,
      size:        8 + Math.random() * 8,
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
    p.wobble   += p.wobbleSpeed
    p.x        += p.vx + Math.sin(p.wobble) * 0.6
    p.y        += p.vy
    p.rotation += p.rotSpeed
    if (p.y > canvas.height + 30) Object.assign(p, createPetal(false))
  }

  const petals = Array.from({ length: MAX_PETALS }, () => createPetal(true))

  ;(function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    petals.forEach(p => { updatePetal(p); drawPetal(p) })
    requestAnimationFrame(loop)
  })()
})()
