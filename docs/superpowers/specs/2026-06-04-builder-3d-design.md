# Спек: DreamBouquet — 3D Генератор букета (Подпроект C)

## Scope

Улучшение существующего `builder.html` (Three.js 3D генератор уже готов):
1. Добавить 20% наценку к ценообразованию
2. Заменить базовую анимацию руки на cinematic 5-фазную анимацию

---

## Контекст: что уже есть в builder.html

- Three.js WebGL рендерер с OrbitControls, тенями, частицами
- 6 типов цветков с реалистичной 3D геометрией (роза, пион, тюльпан, хризантема, лилия, подсолнух)
- Стебли, листья, оборачивание (крафт/бархат/плёнка)
- `updatePrice()` — считает цену без наценки
- `playHandAnimation()` — базовая CSS slide анимация
- `drawHandSVG()` — 2D canvas рука из эллипсов
- `hand-overlay` div — HTML структура уже есть

---

## 1. Ценообразование с 20% наценкой

### `updatePrice()`
```js
function updatePrice() {
  const flowerTotal = bouquetItems.reduce((s, i) => s + i.qty * i.price, 0);
  const subtotal = flowerTotal + wrapPrice;
  const total = Math.ceil(subtotal * 1.2);
  document.getElementById('builder-price').innerHTML = `${total}<span>₼</span>`;
}
```

### `buildWhatsAppMessage()`
Цена в сообщении тоже с 20% наценкой:
```js
const total = Math.ceil((bouquetItems.reduce(...) + wrapPrice) * 1.2);
```

---

## 2. Cinematic анимация руки — 5 фаз (4.5 секунды)

### Фазы

| Фаза | Время | Описание |
|------|-------|----------|
| 1 — Camera zoom | 0–0.8с | Three.js камера летит к букету, фон темнеет |
| 2 — Freeze & overlay | 0.8–1.6с | Скриншот Three.js в overlay canvas, fade in |
| 3 — Hand rises | 1.6–2.8с | SVG рука поднимается снизу, пальцы сжимаются |
| 4 — Push to screen | 2.8–3.8с | scale(1)→scale(2.5) + частицы разлетаются |
| 5 — Fade & redirect | 3.8–4.5с | Overlay гаснет → WhatsApp открывается |

### Фаза 1: Camera zoom
```js
// Interpolate camera from current position to (0, 2, 4) over 800ms
const startPos = camera.position.clone();
const endPos = new THREE.Vector3(0, 2, 4);
const startTime = performance.now();
function zoomIn() {
  const t = Math.min((performance.now() - startTime) / 800, 1);
  const ease = 1 - Math.pow(1 - t, 3); // ease-out-cubic
  camera.position.lerpVectors(startPos, endPos, ease);
  camera.lookAt(0, 1.5, 0);
  if (t < 1) requestAnimationFrame(zoomIn);
  else showOverlay();
}
requestAnimationFrame(zoomIn);
```

### Фаза 2: Overlay capture
```js
function showOverlay() {
  const overlay = document.getElementById('hand-overlay');
  const snapCanvas = document.getElementById('hand-bouquet-canvas');
  
  // Capture Three.js frame
  renderer.render(scene, camera);
  const ctx = snapCanvas.getContext('2d');
  snapCanvas.width = snapCanvas.offsetWidth;
  snapCanvas.height = snapCanvas.offsetHeight;
  ctx.drawImage(renderer.domElement, 0, 0, snapCanvas.width, snapCanvas.height);
  
  overlay.style.display = 'flex';
  requestAnimationFrame(() => overlay.classList.add('active'));
  
  setTimeout(raiseHand, 400);
}
```

### Фаза 3: SVG рука
HTML структура в `hand-overlay`:
```html
<div class="hand-wrapper" id="hand-wrapper">
  <svg id="hand-svg" class="hand-svg hand-open" viewBox="0 0 200 320" ...>
    <!-- paths -->
  </svg>
</div>
```

SVG рука: 5 пальцев (bezier), ладонь, запястье. Два CSS класса меняют `transform: rotate()` на пальцах (не морфинг path — просто вращение):
- `.hand-open` — `transform: rotate(0deg)` на всех `.finger`
- `.hand-grip` — `.f-index { transform: rotate(-25deg) }`, `.f-middle { transform: rotate(-30deg) }` и т.д.

```js
function raiseHand() {
  const wrapper = document.getElementById('hand-wrapper');
  wrapper.classList.add('rising');  // translateY(120%) → translateY(0)
  setTimeout(() => {
    document.getElementById('hand-svg').classList.remove('hand-open');
    document.getElementById('hand-svg').classList.add('hand-grip');
    setTimeout(pushToScreen, 600);
  }, 400);
}
```

### Фаза 4: Push + частицы
```js
function pushToScreen() {
  const scene = document.getElementById('hand-scene');
  scene.classList.add('pushing');  // scale(1) → scale(2.5) translateY(-10%)
  spawnParticles();
  setTimeout(finishAnimation, 1000);
}

function spawnParticles() {
  const overlay = document.getElementById('hand-overlay');
  const colors = bouquetItems.map(i => i.color).filter(Boolean);
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'hand-particle';
    p.style.cssText = `
      left:${40 + Math.random()*20}%;
      top:${30 + Math.random()*20}%;
      background:${colors[i % colors.length] || '#e8175d'};
      animation-delay:${Math.random() * 0.3}s;
      --dx:${(Math.random()-0.5)*200}px;
      --dy:${(Math.random()-0.5)*200}px;
    `;
    overlay.appendChild(p);
  }
}
```

### Фаза 5: Fade & redirect
```js
function finishAnimation() {
  const overlay = document.getElementById('hand-overlay');
  overlay.classList.add('fading');
  setTimeout(() => {
    overlay.style.display = 'none';
    overlay.classList.remove('active','fading');
    overlay.querySelectorAll('.hand-particle').forEach(p => p.remove());
    // Reset camera
    camera.position.set(0, 3, 9);
    controls.target.set(0, 1.5, 0);
    controls.update();
    const msg = buildWhatsAppMessage();
    window.open(`https://wa.me/994702011930?text=${encodeURIComponent(msg)}`, '_blank');
  }, 700);
}
```

---

## 3. CSS для анимации

### Новые keyframes в `style.css`

```css
/* Hand animation */
.hand-wrapper {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%) translateY(120%);
  width: 200px;
  transition: none;
  z-index: 10;
}
.hand-wrapper.rising {
  animation: hand-rise 1.2s cubic-bezier(.22,1,.36,1) forwards;
}
@keyframes hand-rise {
  to { transform: translateX(-50%) translateY(0); }
}

.hand-scene.pushing {
  animation: bouquet-push 1s cubic-bezier(.22,1,.36,1) forwards;
}
@keyframes bouquet-push {
  to { transform: scale(2.5) translateY(-10%); }
}

.hand-particle {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  animation: particle-burst 0.9s ease-out forwards;
}
@keyframes particle-burst {
  0%   { transform: translate(0,0) scale(1); opacity: 1; }
  100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
}

.hand-overlay.fading {
  animation: overlay-fade-out 0.7s ease forwards;
}
@keyframes overlay-fade-out {
  to { opacity: 0; }
}
```

### SVG рука (inline в builder.html)

```svg
<svg id="hand-svg" class="hand-svg hand-open"
  viewBox="0 0 200 320" xmlns="http://www.w3.org/2000/svg"
  style="width:200px;height:320px;filter:drop-shadow(0 8px 24px rgba(0,0,0,0.4))">
  <defs>
    <radialGradient id="skin-grad" cx="40%" cy="30%">
      <stop offset="0%" stop-color="#FDDBB4"/>
      <stop offset="100%" stop-color="#E8A87C"/>
    </radialGradient>
    <filter id="hand-shadow">
      <feDropShadow dx="2" dy="4" stdDeviation="4" flood-color="rgba(0,0,0,0.3)"/>
    </filter>
  </defs>
  <!-- Wrist -->
  <rect x="55" y="260" width="90" height="60" rx="20" fill="url(#skin-grad)" filter="url(#hand-shadow)"/>
  <!-- Palm -->
  <path d="M55,280 Q50,200 60,160 Q80,120 100,115 Q120,120 140,160 Q150,200 145,280 Z"
    fill="url(#skin-grad)" filter="url(#hand-shadow)"/>
  <!-- Index finger -->
  <path class="finger f-index" d="M75,165 Q72,140 74,110 Q76,90 82,85 Q88,90 88,110 Q88,140 85,165 Z"
    fill="url(#skin-grad)"/>
  <!-- Middle finger -->
  <path class="finger f-middle" d="M90,160 Q89,130 91,98 Q93,78 100,74 Q107,78 109,98 Q111,130 110,160 Z"
    fill="url(#skin-grad)"/>
  <!-- Ring finger -->
  <path class="finger f-ring" d="M113,163 Q113,135 115,108 Q117,90 123,87 Q129,90 130,108 Q131,135 130,163 Z"
    fill="url(#skin-grad)"/>
  <!-- Pinky -->
  <path class="finger f-pinky" d="M132,170 Q133,148 135,128 Q137,114 141,113 Q145,114 146,128 Q147,148 145,170 Z"
    fill="url(#skin-grad)"/>
  <!-- Thumb -->
  <path class="finger f-thumb" d="M55,210 Q35,205 28,190 Q24,175 32,168 Q42,162 55,175 Z"
    fill="url(#skin-grad)"/>
  <!-- Knuckle lines -->
  <line x1="77" y1="162" x2="87" y2="162" stroke="#D4956A" stroke-width="1.5" opacity="0.5"/>
  <line x1="92" y1="157" x2="108" y2="157" stroke="#D4956A" stroke-width="1.5" opacity="0.5"/>
  <line x1="115" y1="160" x2="129" y2="160" stroke="#D4956A" stroke-width="1.5" opacity="0.5"/>
  <!-- Stem -->
  <line x1="100" y1="110" x2="100" y2="20" stroke="#2a7a35" stroke-width="5" stroke-linecap="round"/>
</svg>
```

---

## 4. Файловые изменения

| Файл | Изменение |
|------|-----------|
| `templates/builder.html` | `updatePrice()` × 1.2, `buildWhatsAppMessage()` × 1.2, `playHandAnimation()` полная замена, `drawHandSVG()` удалить, добавить SVG руку в `hand-overlay` |
| `static/css/style.css` | Добавить keyframes: hand-rise, bouquet-push, particle-burst, overlay-fade-out + `.hand-wrapper`, `.hand-particle` |
