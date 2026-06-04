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
  const tabs  = document.querySelectorAll('.occasion-tab')
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
          <div class="quiz-result-shop">🏪 ${offer.shop || ''}</div>
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
