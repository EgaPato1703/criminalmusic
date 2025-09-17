# Criminal Music - Underground Platform

<div align="center">
  <h1>🎵 CRIMINAL MUSIC 🎵</h1>
  <p><strong>Музыкальная платформа уличного андеграунда</strong></p>
  
  ![Version](https://img.shields.io/badge/version-1.0.0-red)
  ![License](https://img.shields.io/badge/license-MIT-blue)
  ![Platform](https://img.shields.io/badge/platform-Telegram%20Mini%20App-blue)
  ![Status](https://img.shields.io/badge/status-MVP-orange)
</div>

## 🌟 Описание

Criminal Music — это уникальная музыкальная платформа с криминальной тематикой и атмосферой уличного андеграунда, созданная как Telegram Mini App. Пользователи могут регистрироваться как слушатели или артисты, загружать треки, создавать коллекции, слушать радио по настроению и взаимодействовать с контентом.

### ✨ Основные возможности

- 🎭 **Роли пользователей**: Слушатели и Артисты с разными возможностями
- 🎵 **Загрузка музыки**: Артисты могут загружать треки до 200 МБ
- 📻 **Радио по настроению**: Плейлисты по настроению (агрессия, меланхолия, любовь, тайна, энергия)
- 🔍 **Поиск**: Умный поиск с автодополнением по артистам, трекам, жанрам
- ❤️ **Взаимодействие**: Лайки, комментарии, подписки, коллекции
- 🎨 **Криминальный дизайн**: Тёмная тема с неоновыми акцентами
- 📱 **Telegram Integration**: Полная интеграция с Telegram Mini App SDK
- 🔄 **Real-time**: WebSocket уведомления о новых треках, лайках, подписчиках

## 🏗️ Архитектура

### Backend
- **Node.js** + Express.js
- **MongoDB** с Mongoose ODM
- **Socket.IO** для real-time функций
- **JWT** аутентификация через Telegram
- **Multer** для загрузки файлов
- **RESTful API** с полной документацией

### Frontend
- **React 18** с хуками
- **Styled Components** для стилизации
- **Framer Motion** для анимаций
- **Telegram WebApp SDK**
- **Howler.js** для аудио
- **React Hot Toast** для уведомлений

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 16+ и npm
- MongoDB 4.4+
- Telegram Bot Token

### Установка

1. **Клонируйте репозиторий**
   ```bash
   git clone https://github.com/yourusername/criminal-music.git
   cd criminal-music
   ```

2. **Установите зависимости**
   ```bash
   npm run install:all
   ```

3. **Настройте переменные окружения**
   
   Создайте `.env` файл в папке `server/`:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/criminal-music
   JWT_SECRET=your_super_secret_jwt_key_here
   TELEGRAM_BOT_TOKEN=8454342252:AAHQDVIO_88fzt1o0yf6Bash43sc7Ho030o4
   
   # File Storage (настройте для продакшена)
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_BUCKET_NAME=criminal-music-files
   AWS_REGION=us-east-1
   
   # Telegram Mini App
   TELEGRAM_BOT_USERNAME=criminal_music_bot
   WEBAPP_URL=https://your-domain.railway.app
   ```

4. **Запустите MongoDB**
   ```bash
   # Убедитесь что MongoDB запущен
   mongod
   ```

5. **Запустите приложение**
   ```bash
   # Development mode (запускает и сервер и клиент)
   npm run dev
   
   # Или раздельно:
   npm run server:dev  # Backend на порту 5000
   npm run client:dev  # Frontend на порту 3000
   ```

## 🎯 Структура проекта

```
criminal-music/
├── server/                 # Backend (Node.js + Express)
│   ├── models/            # MongoDB модели
│   ├── routes/            # API роуты
│   ├── middleware/        # Middleware функции
│   ├── config.js          # Конфигурация
│   └── index.js           # Главный файл сервера
├── client/                # Frontend (React)
│   ├── src/
│   │   ├── components/    # React компоненты
│   │   ├── pages/         # Страницы приложения
│   │   ├── contexts/      # React контексты
│   │   ├── hooks/         # Кастомные хуки
│   │   ├── services/      # API сервисы
│   │   └── styles/        # Стили и темы
│   └── public/            # Статические файлы
├── package.json           # Root package.json
└── README.md
```

## 🎨 Дизайн система

### Цветовая палитра
- **Чёрный**: `#000000` (основной фон)
- **Тёмно-красный**: `#8B0000` (акценты)
- **Неон-синий**: `#00FFFF` (текст и подсветка)
- **Грязно-серый**: `#2F2F2F` (второстепенные элементы)

### Шрифты
- **Primary**: 'Metal Mania' (основной текст)
- **Secondary**: 'Bangers' (заголовки)
- **Accent**: 'Creepster' (специальные элементы)

### Настроения
- 🔫 **Агрессия**: Хардкор, рейдж, файт
- 🌧️ **Меланхолия**: Грусть, дождь, одиночество
- ❤️‍🔥 **Любовь**: Романтика, страсть, сердце
- 🎭 **Тайна**: Мистика, тёмное, секреты
- 🏃 **Энергия**: Быстро, адреналин, бег

## 🔧 API Endpoints

### Аутентификация
- `POST /api/auth/login` - Вход через Telegram
- `GET /api/auth/me` - Получить профиль
- `POST /api/auth/setup-role` - Настройка роли

### Треки
- `GET /api/tracks` - Список треков
- `POST /api/tracks` - Создать трек (только артисты)
- `GET /api/tracks/:id` - Получить трек
- `POST /api/tracks/:id/like` - Лайк/дизлайк
- `POST /api/tracks/:id/play` - Отметить воспроизведение

### Пользователи
- `GET /api/users/:id` - Профиль пользователя
- `POST /api/users/:id/follow` - Подписаться/отписаться
- `PUT /api/users/profile` - Обновить профиль

### Поиск
- `GET /api/search` - Универсальный поиск
- `GET /api/search/suggestions` - Автодополнение

### Настроения
- `GET /api/moods` - Список настроений
- `GET /api/moods/:mood/radio` - Радио по настроению

## 🚀 Деплой

### Railway (рекомендуется)

1. Подключите репозиторий к Railway
2. Настройте переменные окружения
3. Railway автоматически развернёт приложение

### Ручной деплой

1. **Соберите фронтенд**
   ```bash
   npm run client:build
   ```

2. **Настройте продакшен переменные**
   ```bash
   export NODE_ENV=production
   export MONGODB_URI=your_production_mongodb_uri
   # ... другие переменные
   ```

3. **Запустите сервер**
   ```bash
   npm start
   ```

## 🧪 Тестирование

```bash
# Запустить тесты
npm test

# Тесты с покрытием
npm run test:coverage

# E2E тесты
npm run test:e2e
```

## 📱 Telegram Bot Setup

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Получите токен бота
3. Настройте Menu Button:
   ```
   /setmenubutton
   @your_bot_username
   Criminal Music
   https://your-domain.com
   ```

## 🤝 Участие в разработке

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Создайте Pull Request

### Стандарты кода
- ESLint для JavaScript
- Prettier для форматирования
- Conventional Commits для сообщений коммитов

## 📄 Лицензия

MIT License. См. [LICENSE](LICENSE) для деталей.

## 🆘 Поддержка

- 📧 Email: support@criminal-music.com
- 💬 Telegram: [@criminal_music_support](https://t.me/criminal_music_support)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/criminal-music/issues)

## 🎵 Roadmap

### MVP (6 недель) ✅
- [x] Регистрация и роли пользователей
- [x] Загрузка и воспроизведение треков
- [x] Радио по настроению
- [x] Базовые взаимодействия (лайки, комментарии)
- [x] Поиск и коллекции

### Phase 2 (следующие 6 недель)
- [ ] Монетизация через TON
- [ ] Расширенная аналитика
- [ ] Плейлисты и альбомы
- [ ] Система достижений
- [ ] Модерация контента

### Phase 3 (будущее)
- [ ] Мобильные приложения
- [ ] Live стриминг
- [ ] NFT интеграция
- [ ] Социальные функции

---

<div align="center">
  <p><strong>🎵 Добро пожаловать в тёмную сторону музыки 🎵</strong></p>
  <p>Made with ❤️‍🔥 by Criminal Music Team</p>
</div>
