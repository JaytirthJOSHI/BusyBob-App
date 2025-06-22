# BusyBob Mobile App

The ultimate student productivity platform - now on mobile! BusyBob helps busy students manage tasks, track mood, maintain journals, and organize their academic life all in one place.

## Features

### 🎯 Task Management
- Create and organize tasks with priorities, categories, and stress levels
- Mark tasks as complete/incomplete
- View tasks by date on the calendar
- Quick task creation from the home screen

### 😊 Mood Tracking
- Daily mood logging with 1-5 scale ratings
- Add comments and reflections to mood entries
- View mood history and patterns
- Visual mood indicators throughout the app

### 📝 Journal System
- Create personal journal entries with rich text
- Optional titles and mood ratings for entries
- Browse and manage journal history
- Private and secure entry storage

### 📅 Interactive Calendar
- Visual calendar with task integration
- See tasks marked on specific dates
- Filter and view tasks by selected date
- Color-coded task completion status

### ⚙️ User Management
- Secure authentication with email/password
- User profiles and account management
- Settings and preferences
- Logout functionality

### 🎨 Modern UI
- Clean, intuitive interface
- Consistent design system
- Smooth animations and transitions
- Mobile-optimized user experience

## Technology Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation 6
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Expo Vector Icons (Ionicons)
- **Calendar**: React Native Calendars
- **Styling**: React Native StyleSheet

## Database Integration

The app uses the same Supabase database as the web version, ensuring data synchronization across platforms. Key tables include:

- `users` - User profiles and authentication data
- `tasks` - Task management with priorities and categories
- `feelings` - Mood tracking entries
- `journal_entries` - Personal journal content

## Getting Started

### Prerequisites

- Node.js (18.0.0 or later)
- npm or yarn
- Expo CLI (optional, for additional features)
- iOS Simulator (for iOS development)
- Android Studio/Emulator (for Android development)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd BusyBob-App
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   The app is configured with Supabase credentials in `app.config.js`:
   - Supabase URL: `https://vypzihmbljzswpznzlzr.supabase.co`
   - Supabase Anon Key: (configured)
   - Spotify Client ID: (configured)

4. Start the development server:
   ```bash
   npm start
   ```

5. Run on your device:
   - **iOS**: Press `i` in the terminal or scan QR code with Camera app
   - **Android**: Press `a` in the terminal or scan QR code with Expo Go app
   - **Web**: Press `w` in the terminal (for testing)

### Building for Production

#### iOS
```bash
npx expo build:ios
```

#### Android
```bash
npx expo build:android
```

## Project Structure

```
BusyBob-App/
├── screens/                 # Screen components
│   ├── LoginScreen.js       # Authentication screen
│   ├── HomeScreen.js        # Dashboard with overview
│   ├── TasksScreen.js       # Task management
│   ├── MoodScreen.js        # Mood tracking
│   ├── JournalScreen.js     # Journal entries
│   ├── CalendarScreen.js    # Calendar view
│   └── SettingsScreen.js    # User settings
├── lib/                     # Utilities and configurations
│   └── supabase.js         # Database client and API functions
├── assets/                  # Static assets (images, icons)
├── App.js                   # Main app component with navigation
├── app.config.js           # Expo configuration
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

## Key Components

### Authentication
- Secure login/signup with email and password
- User session management
- Protected routes based on authentication state

### Navigation
- Tab-based navigation for main features
- Stack navigation for detailed views
- Automatic routing based on auth status

### Data Management
- Real-time data synchronization with Supabase
- Optimistic updates for better UX
- Error handling and user feedback

### UI Components
- Consistent styling across screens
- Responsive design for different screen sizes
- Loading states and empty state handling

## Database Schema

The app uses the following main database tables:

### Users
```sql
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### Tasks
```sql
tasks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  due_time TIME NOT NULL,
  stress_level INTEGER CHECK (1-5),
  completed BOOLEAN DEFAULT false,
  priority TEXT CHECK ('low', 'medium', 'high'),
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### Mood Tracking
```sql
feelings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  rating INTEGER CHECK (1-5) NOT NULL,
  comments TEXT,
  created_at TIMESTAMPTZ
)
```

### Journal Entries
```sql
journal_entries (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title TEXT,
  content TEXT NOT NULL,
  mood_rating INTEGER CHECK (1-5),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

## Features in Development

- [ ] Push notifications for task reminders
- [ ] Dark mode support
- [ ] Biometric authentication
- [ ] Canvas LMS integration
- [ ] StudentVue integration
- [ ] Spotify music integration
- [ ] Offline support
- [ ] Data export functionality

## Contributing

This is a student productivity application designed to help busy students manage their academic and personal lives. The app focuses on simplicity, functionality, and user experience.

## License

This project has a special license. Please see the LICENSE file for details on what you can and cannot do with the code.

## Support

For support and questions, please refer to the settings screen in the app or contact the development team.

---

**Made for students who hustle.** 🚀

