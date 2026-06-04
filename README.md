Сайт "Сказочный Букет"

Запуск локально:

```powershell
pip install -r requirements.txt
.venv\Scripts\python.exe website\app.py
```

Функции, добавленные:
- Красивый ванильно‑сказочный дизайн (CSS + SVG логотип + анимации)
- Песочница оплаты (`/pay_sandbox`) — имитирует успешный платёж
- Уведомления: лог `website/data/notifications.log` и опциональная отправка email через SMTP переменные окружения (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `NOTIFY_EMAIL`)
- Импортер локальных предложений: `website/importer.py` — поддерживает JSON и CSV в `website/local_sources/`

Примеры:
- Поместите JSON или CSV в `website/local_sources/` и запустите:

```powershell
python website/importer.py
```

Оплата (песочница): после оформления заказа на странице подтверждения нажмите `Оплатить (песочница)`, JS отправит запрос к `/pay_sandbox` и переведёт вас на страницу подтверждения с пометкой оплаты.

Быстрая публичная проверка (ngrok):

1. Установите `ngrok` и войдите в аккаунт: https://ngrok.com/
2. Запустите локально сервер (как выше), затем в отдельном терминале выполните:

```powershell
ngrok http 5000
```

3. ngrok выдаст публичный URL вида `https://xxxx.ngrok.app` — откройте его в браузере.

Развёртывание на платформе (Render / Heroku / Railway):

- Подойдёт `Dockerfile` или `Procfile` в корне проекта. Примеры команд для Heroku:

```powershell
heroku create my-fairytale-bouquet
git push heroku main
heroku open
```

Если хотите, могу попытаться автоматически опубликовать сайт на Render/Heroku, но для этого потребуется доступ к учётным данным или подключение репозитория — дайте знать, если доверяете и готовы предоставить детали.
