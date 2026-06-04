# Спек: DreamBouquet — Реалистичные анимации цветов (Подпроект B)

## Scope

Заменить текущие абстрактные анимации (летящие кружки-лепестки, bloom-пятна) на реалистичные распускающиеся SVG-цветы и реалистичные падающие лепестки на Canvas.

---

## 1. Архитектура

### Новый файл
`static/js/flowers.js` — весь код анимаций. Подключается в `base.html` перед `</body>`. Текущий `main.js` не трогается.

### Удаляется
Код лепестков в `main.js` (функция `initPetals` или аналог, `petals-canvas` логика). HTML-элемент `<canvas id="petals-canvas">` остаётся — только JS-рисование меняется.

### Три компонента в `flowers.js`

| Компонент | Элемент | Триггер |
|-----------|---------|---------|
| `HeroGarden` | `#bloom-container` в hero | Загрузка страницы |
| `ScrollGarden` | `<div id="scroll-garden">` (новый) | Intersection Observer |
| `RealisticPetals` | `<canvas id="petals-canvas">` | requestAnimationFrame |

`base.html` получает одно изменение: `<script src="{{ url_for('static', filename='js/flowers.js') }}">` перед `</body>`. Новый `<div id="scroll-garden">` добавляется только в `index.html` (не в base.html) — чтобы цветы не показывались на страницах заказа и подтверждения.

---

## 2. SVG-цветки и анимация распускания

### Три типа цветков

**Роза** (`flower-rose`):
- 5 внешних лепестков + 3 внутренних
- Лепестки: вытянутые, заострённые, спирально закручены в bud
- Цвета: `#E8175D` → `#FF6B8A` (градиент от основания к кончику)

**Пион** (`flower-peony`):
- 8 округлых лепестков + плотная серединка
- Лепестки: широкие, чашеобразное раскрытие
- Цвета: `#C4A7E7` → `#FFB6C1`

**Тюльпан** (`flower-tulip`):
- 6 вытянутых лепестков
- Открываются вверх-в-стороны
- Цвета: `#FFB347` → `#FFF0CC`

### CSS-анимация распускания

Три состояния через CSS-классы:
- `.flower` (bud — закрытый): лепестки сжаты к центру, `transform: rotate(0) scale(0.1)`
- `.flower.blooming`: анимация `bloom` 1.2s `ease-out forwards`
- `.flower.bloomed`: финальное состояние

Каждый лепесток — отдельный `<path>` внутри SVG с `transform-origin` у основания лепестка. `animation-delay` нарастает от центра к краям (0ms, 80ms, 160ms...) — эффект живого раскрытия изнутри-наружу.

`will-change: transform` добавляется перед анимацией, снимается по `animationend`.

### Размеры
- Hero-цветки: 80–120px
- Scroll-цветки: 50–70px

---

## 3. Размещение и скролл-триггер

### HeroGarden
4–6 цветков рендерятся в `#bloom-container` при загрузке. Каскад запуска: каждый следующий цветок стартует на 300ms позже предыдущего. Позиции случайны в пределах контейнера.

### ScrollGarden
`<div id="scroll-garden" style="position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;overflow:hidden">` добавляется в `templates/index.html` (перед `{% endblock %}`). Только главная страница.

8 цветков с фиксированными позициями (чередуются слева/справа, не перекрывают основной контент):

| top | left/right | Тип |
|-----|-----------|-----|
| 15% | left: 2% | Роза |
| 30% | right: 3% | Пион |
| 45% | left: 1% | Тюльпан |
| 58% | right: 4% | Роза |
| 70% | left: 3% | Пион |
| 82% | right: 2% | Тюльпан |
| 90% | left: 5% | Роза |
| 95% | right: 5% | Пион |

**Intersection Observer:**
```js
new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('blooming');
      observer.unobserve(e.target); // однократно
    }
  });
}, { threshold: 0.2, rootMargin: '0px 0px -50px 0px' });
```

---

## 4. Реалистичные лепестки (Canvas)

### Замена
Весь JS-код текущих лепестков (в `main.js`) удаляется. `RealisticPetals` в `flowers.js` берёт тот же `<canvas id="petals-canvas">`.

### Форма лепестка
Каждый лепесток рисуется через `ctx.bezierCurveTo` — овальная изогнутая форма с заострением у основания. Не эллипс. Заливка: `ctx.createLinearGradient` с двумя оттенками (светлее в центре, насыщеннее у края).

### 4 варианта цвета лепестков
- Розовый: `#FF9BB5` → `#FF6B8A`
- Белый: `#FFFFFF` → `#FFE0EC`
- Красный: `#E8175D` → `#FF4477`
- Лавандовый: `#D4B8F0` → `#C4A7E7`

### Физика каждого лепестка
```js
{
  x, y,           // позиция
  vx,             // боковой снос (-0.5..0.5)
  vy,             // скорость падения (1..2.5)
  rotation,       // текущий угол
  rotSpeed,       // скорость вращения (-0.03..0.03)
  wobble,         // фаза синусоиды
  wobbleSpeed,    // частота покачивания
  wobbleAmp,      // амплитуда покачивания (15..30px)
  opacity,        // 0..1, плавное появление/исчезновение
  color,          // один из 4 вариантов
  size,           // 8..16px
}
```

`x += vx + sin(wobble) * wobbleAmp * dt` — покачивание при падении.

### Количество
- Desktop (>768px): 18 лепестков одновременно
- Mobile (≤768px): 10 лепестков

Новый лепесток появляется вверху когда старый уходит за нижний край экрана.

---

## 5. Изменения в файлах

| Файл | Изменение |
|------|-----------|
| `static/js/flowers.js` | Создать — весь новый код (~350 строк) |
| `static/js/main.js` | Удалить код `petals-canvas` (найти и убрать) |
| `templates/base.html` | Добавить `<script src="flowers.js">` перед `</body>` |
| `templates/index.html` | Добавить `<div id="scroll-garden">` перед `{% endblock %}` |
