# NutriChef - AI-Powered Nutrition and Meal Planning App

NutriChef is an intelligent nutrition and meal planning application that helps users manage their kitchen inventory, discover recipes, plan meals, and track their nutrition goals using AI-powered recommendations.

## Features

- 🤖 **AI-Powered Ingredient Detection** - Snap photos of ingredients and let AI automatically catalog them
- 🍳 **Smart Recipe Recommendations** - Get personalized recipe suggestions based on available ingredients
- 📅 **Meal Planning** - Create and manage weekly meal plans with ease
- 📊 **Nutrition Tracking** - Monitor calorie intake and track macronutrients
- 🌍 **Multi-Language Support** - Available in English and Hungarian
- 🌙 **Dark Mode** - Comfortable viewing in any lighting condition
- 📱 **Cross-Platform** - Available as web app and Android app

## Technology Stack

### Frontend
- **React** 19.1.1 - UI framework
- **Vite** - Build tool and dev server
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Redux Toolkit** - State management
- **React Router** - Client-side routing
- **GSAP** - High-performance animations
- **i18next** - Internationalization

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Prisma** - ORM for database
- **TypeScript** - Type-safe backend code
- **JWT** - Authentication
- **Google AI** - Recipe generation
- **Google Cloud Vision** - Image recognition

### Mobile
- **Capacitor** 7.x - Cross-platform native runtime
- **Android SDK** 33+ - Android development

## Project Structure

```
NutriChef/
├── frontend/              # React web application
│   ├── src/              # Source code
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── store/        # Redux store
│   │   ├── context/      # React contexts
│   │   └── i18n/         # Internationalization
│   ├── android/          # Android native project (Capacitor)
│   ├── dist/             # Production build
│   └── package.json      # Dependencies and scripts
├── backend/              # Node.js backend API
│   ├── src/              # Source code
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Express middleware
│   │   ├── routes/       # API routes
│   │   └── index.ts      # Entry point
│   └── package.json      # Dependencies and scripts
├── ANDROID_BUILD_GUIDE.md           # Android build documentation
├── PLAY_STORE_ASSETS.md             # Play Store submission guide
└── ANDROID_IMPLEMENTATION_SUMMARY.md # Implementation details
```

## Getting Started

### Prerequisites

- **Node.js** 16+ and npm
- **PostgreSQL** (for backend)
- **Android Studio** (for Android development)

### Web Application Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/AFekexd/NutriChef.git
   cd NutriChef
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

4. **Build for production**
   ```bash
   npm run build
   ```

### Backend Setup

1. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables**
   Create a `.env` file in the `backend` directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/nutrichef"
   JWT_SECRET="your-secret-key"
   GOOGLE_CLOUD_VISION_KEY="your-google-cloud-key"
   GOOGLE_AI_API_KEY="your-google-ai-key"
   ```

3. **Setup database**
   ```bash
   npm run migrate:dev
   npm run seed
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:3000`

### Android App Setup

See [ANDROID_BUILD_GUIDE.md](ANDROID_BUILD_GUIDE.md) for detailed instructions.

**Quick start:**

1. **Build the web app**
   ```bash
   cd frontend
   npm run build
   ```

2. **Sync with Android**
   ```bash
   npm run android:sync
   ```

3. **Open in Android Studio**
   ```bash
   npm run android:open
   ```

4. **Run on device/emulator**
   Click the Run button in Android Studio

## Available Scripts

### Frontend (`frontend/`)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build
- `npm run android:build` - Build and sync to Android
- `npm run android:sync` - Sync web assets to Android
- `npm run android:open` - Open Android Studio
- `npm run android:run` - Full Android workflow

### Backend (`backend/`)
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript
- `npm run studio` - Open Prisma Studio
- `npm run migrate:dev` - Run database migrations
- `npm run seed` - Seed database with sample data

## Development

### Code Style
- Follow TypeScript best practices
- Use ESLint for linting
- Use Prettier for code formatting (if configured)
- Write meaningful commit messages

### Testing
- Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- Test on different screen sizes and devices
- Test all user flows before submitting PRs
- For Android: Test on different Android versions

### Contributing
1. Create a feature branch from `main`
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Android Development

The Android version is built using Capacitor, which wraps the React web app into a native Android application.

### Key Files
- `frontend/capacitor.config.ts` - Capacitor configuration
- `frontend/android/` - Native Android project
- `frontend/android/app/src/main/AndroidManifest.xml` - App permissions

### Building for Play Store
1. Update version in `android/app/build.gradle`
2. Build the app: `npm run android:build`
3. Generate signed bundle in Android Studio
4. Upload to Google Play Console

See [ANDROID_BUILD_GUIDE.md](ANDROID_BUILD_GUIDE.md) for complete instructions.

## Play Store Submission

For detailed Play Store submission requirements, see:
- [PLAY_STORE_ASSETS.md](PLAY_STORE_ASSETS.md) - Asset requirements and listing information
- [ANDROID_BUILD_GUIDE.md](ANDROID_BUILD_GUIDE.md) - Build and deployment process

**Checklist:**
- [ ] App icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (minimum 2)
- [ ] Privacy policy
- [ ] App description and metadata
- [ ] Content rating
- [ ] Signed release bundle

## Environment Variables

### Frontend
Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### Backend
Create `backend/.env`:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/nutrichef
JWT_SECRET=your-secret-key
PORT=3000
NODE_ENV=development
GOOGLE_CLOUD_VISION_KEY=your-key
GOOGLE_AI_API_KEY=your-key
```

## Troubleshooting

### Frontend Issues
- **Build fails**: Clear cache with `rm -rf node_modules package-lock.json && npm install`
- **Port in use**: Change port in `vite.config.ts` or kill process on port 5173

### Backend Issues
- **Database connection fails**: Check PostgreSQL is running and credentials are correct
- **Migration fails**: Reset database with `npx prisma migrate reset`

### Android Issues
- **Build fails**: Run `./gradlew clean` in `frontend/android/`
- **App crashes**: Check Android Studio Logcat for errors
- **White screen**: Ensure `npm run build` completed successfully

See [ANDROID_BUILD_GUIDE.md](ANDROID_BUILD_GUIDE.md) for more troubleshooting.

## Documentation

- [ANDROID_BUILD_GUIDE.md](ANDROID_BUILD_GUIDE.md) - Complete Android build guide
- [PLAY_STORE_ASSETS.md](PLAY_STORE_ASSETS.md) - Play Store submission guide
- [ANDROID_IMPLEMENTATION_SUMMARY.md](ANDROID_IMPLEMENTATION_SUMMARY.md) - Implementation details
- [frontend/android/README.md](frontend/android/README.md) - Android project documentation

## License

[Specify your license]

## Support

For questions or issues:
- Create an issue on GitHub
- Contact: support@nutrichef.app

## Credits

Developed by [AFekexd](https://github.com/AFekexd)

---

**Version:** 1.0.0  
**Last Updated:** October 2025  
**Status:** Ready for deployment
