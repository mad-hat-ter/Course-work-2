# Руководство программиста

## 1. Условия развёртывания

- Python 3.12+ или Docker
- Node.js
- PostgreSQL 16
- Переменные окружения в `backend/.env`, `frontend/.env`
- Установка зависимостей из `backend/requirements.txt` и `frontend/package.json`

---

## 2. Характеристики программы

### Структура репозитория

| Структура                   | Назначение                                                      |
| --------------------------- | --------------------------------------------------------------- |
| `backend/app/main.py`       | Точка входа FastAPI, подключение роутеров, логирование запросов |
| `backend/app/api/v1/`       | REST: auth, user, schedule, shift, department                   |
| `backend/app/services/`     | Бизнес-логика: расписания, смены, пользователи, авторизация     |
| `backend/app/crud/`         | Репозитории SQLAlchemy                                          |
| `backend/app/models/`       | Модели: User, Department, Position, Schedule, Shift             |
| `backend/app/schemas/`      | Pydantic-схемы                                                  |
| `backend/app/core/`         | Конфигурация, безопасность                                      |
| `backend/app/db/`           | Подключение БД                                                  |
| `backend/migrations/`       | Миграции Alembic                                                |
| `backend/tests/`            | Pytest-тесты                                                    |
| `frontend/src/pages/`       | Страницы сайта: вход, профиль, расписание, смены, статистика    |
| `frontend/src/utils/`       | Вспомогательные функции: роли, сетка расписания, время МСК      |
| `frontend/src/api/axios.ts` | HTTP-клиент                                                     |
| `docker-compose.yml`        | Контейнеры PostgreSQL, backend, frontend                        |

### Модули backend

| Модуль                   | Назначение                                                |
| ------------------------ | --------------------------------------------------------- |
| `services/auth.py`       | Регистрация, вход, выдача JWT                             |
| `services/schedule.py`   | CRUD расписаний, проверка периода записи, назначение смен |
| `services/shift.py`      | CRUD смен и типов смен, запись/снятие куратора            |
| `services/user.py`       | Профили, фильтрация сотрудников, статистика и оплата      |
| `services/department.py` | Отделы, проверка доступа по отделу                        |
| `crud/schedule.py`       | Загрузка расписания                                       |
| `crud/shift.py`          | Запись на смену с проверкой свободных мест                |
| `exceptions/errors.py`   | Тексты ошибок                                             |
| `api/deps.py`            | Проверка роли пользователя                                |

### Модули frontend

| Модуль                         | Назначение                             |
| ------------------------------ | -------------------------------------- |
| `utils/roleAccess.ts`          | Меню и доступ к маршрутам по роли      |
| `utils/scheduleGrid.ts`        | Построение сетки расписания            |
| `utils/schedulePermissions.ts` | Правила записи/снятия для куратора     |
| `utils/scheduleForm.ts`        | Генерация смен при создании расписания |
| `utils/moscowTime.ts`          | Работа с московским временем           |
| `components/RoleRoute.tsx`     | Защита маршрутов по роли               |

---

## 3. Запуск

Backend

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
cd backend
alembic upgrade head
cd ..
python -m backend.app.db.seed
uvicorn backend.app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Или

```bash
cp .env.docker.example .env
docker compose up -d --build
```

### Тестирование

Backend

```bash
cd backend
pytest tests/ --cov=app
```

Frontend

```bash
cd frontend
npm run test
npm run test:coverage
```

### Настройка переменных в `.env`

Backend

| Переменная                    | Описание                      |
| ----------------------------- | ----------------------------- |
| `DATABASE_URL`                | Строка подключения PostgreSQL |
| `SECRET_KEY`                  | Подпись JWT                   |
| `ALGORITHM`                   | Алгоритм JWT                  |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Время жизни токена            |
| `CORS_ORIGINS`                | Разрешённые origin            |
| `SQLALCHEMY_ECHO`             | Лог SQL-запросов              |

Frontend

| Переменная     | Описание    |
| -------------- | ----------- |
| `VITE_API_URL` | URL backend |

Docker

| Переменная                                          | Описание             |
| --------------------------------------------------- | -------------------- |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Параметры PostgreSQL |
| `SECRET_KEY`, `CORS_ORIGINS`, `VITE_API_URL`        | Как выше             |
| `BACKEND_PORT`, `FRONTEND_PORT`                     | Порты контейнеров    |

---

## 4. Входные и выходные данные

### Входные данные

| Место      | Данные                                                     |
| ---------- | ---------------------------------------------------------- |
| Браузер    | Email, пароль, расписания, фильтры статистики              |
| REST API   | JSON запросов, query-параметры, Bearer JWT                 |
| PostgreSQL | Пользователи, отделы, должности, расписания, смены, записи |

### Выходные данные

| Место       | Данные                                            |
| ----------- | ------------------------------------------------- |
| REST API    | JSON: пользователи, расписания, смены, статистика |
| CSV-экспорт | Отчёт по статистике кураторов                     |
| Логи        | HTTP-запросы и события сайта                      |
| Браузер     | Токен, кэш                                        |

### Основные эндпоинты API

**Auth**

| Метод | Путь     | Описание      |
| ----- | -------- | ------------- |
| POST  | `/login` | Выдача токена |

**User**

| Метод | Путь                     | Роль           | Описание                    |
| ----- | ------------------------ | -------------- | --------------------------- |
| GET   | `/user/me`               | Все            | Текущий пользователь        |
| GET   | `/user/shiftme`          | CURATOR        | Смены куратора              |
| GET   | `/user/statistics/me`    | CURATOR        | Личная статистика за период |
| GET   | `/user/statistics/admin` | MANAGER, ADMIN | Статистика отдела           |
| GET   | `/user/`                 | MANAGER, ADMIN | Список сотрудников          |
| POST  | `/user/`                 | ADMIN          | Создание сотрудника         |

**Schedule**

| Метод  | Путь             | Роль           | Описание          |
| ------ | ---------------- | -------------- | ----------------- |
| GET    | `/schedule/`     | Все            | Список расписаний |
| GET    | `/schedule/{id}` | Все            | Детали сетки      |
| POST   | `/schedule/`     | MANAGER, ADMIN | Создание          |
| PATCH  | `/schedule/{id}` | MANAGER, ADMIN | Редактирование    |
| DELETE | `/schedule/{id}` | MANAGER, ADMIN | Удаление          |

**Shift**

| Метод  | Путь                                 | Описание          |
| ------ | ------------------------------------ | ----------------- |
| POST   | `/shift/{shift_id}/assign/{user_id}` | Запись на смену   |
| DELETE | `/shift/{shift_id}/assign/{user_id}` | Снятие со смены   |
| GET    | `/shift_type/`                       | Список типов смен |

Ответы об ошибках: `{ "detail": "текст сообщения" }`, коды 400, 401, 403, 404, 409.

---

## 5. Сообщения

Необработанные исключения логируются. Действия пользователей фиксируются в HTTP-логах.

### Ошибки API

| Сообщение                                            | Код | Значение                                                    |
| ---------------------------------------------------- | --- | ----------------------------------------------------------- |
| Неверный email или пароль                            | 401 | Неверные учётные данные                                     |
| У вас недостаточно прав для выполнения этой операции | 403 | Неверная роль для операции                                  |
| Расписание не найдено                                | 404 | Нет расписания с указанным id                               |
| Смена не найдена                                     | 404 | Нет смены с указанным id                                    |
| Куратор уже записан на эту смену                     | 409 | Дублирование записи                                         |
| На смене нет свободных мест                          | 409 | Слот уже занят                                              |
| Нельзя записаться на прошедшую смену                 | 400 | Время смены уже прошло                                      |
| Запись на смены в этом расписании ещё не открыта     | 400 | Время открытия расписания еще не наступило                  |
| Удаление записей на смены сейчас недоступно          | 400 | Время открытия расписания еще не наступило или уже окончено |
| Конец периода не может быть раньше начала            | 400 | Неверный диапазон дат                                       |

---

## 6. Добавление новых разделов

| Что добавлено                 | Где править                                                                             |
| ----------------------------- | --------------------------------------------------------------------------------------- |
| Новая страница                | `frontend/src/pages/`, маршрут в `App.tsx`, пункт меню в `roleAccess.ts`                |
| Новая роль                    | `models/user.py`, `RoleChecker` в API, `roleAccess.ts`                                  |
| Новый REST-эндпоинт           | `api/v1/`, сервис в `services/`, схема в `schemas/`                                     |
| Новая таблица БД              | Модель в `models/`, миграция `alembic revision`                                         |
| Новый тип смены               | `POST /shift_type/`, поля `rate`, `quantity_for_increased_payment`, `increased_payment` |
| Изменение логики оплаты       | `services/user.py` и `_calculate_payment`, тесты                                        |
| Новое правило записи на смену | `services/schedule.py` и `validate_curator_assign`, `schedulePermissions.ts`            |
