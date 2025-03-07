# Taskify - Modern Task Management App

Taskify is a high-performance, feature-rich task management application built with React Native and Expo. It offers a beautiful, intuitive interface with smooth animations and a responsive design that adapts to both light and dark modes.

## Features

- **Modern UI**: Clean, minimalistic design with smooth animations powered by React Native Reanimated
- **Gesture-based interactions**: Swipe to complete or delete tasks
- **Kanban board**: Visualize your workflow with a drag-and-drop kanban board
- **Calendar view**: See your tasks organized by date
- **Offline support**: Full functionality even without an internet connection
- **Real-time sync**: Seamless synchronization with Firebase when online
- **Push notifications**: Get reminders for upcoming tasks
- **Adaptive theming**: Automatically switches between light and dark mode based on time of day or system settings

## Tech Stack

- **React Native** with Expo
- **React Navigation** for navigation
- **Zustand** for state management
- **React Native Reanimated** for animations
- **React Native Gesture Handler** for gesture-based interactions
- **Firebase** for backend and real-time synchronization
- **AsyncStorage** for local data persistence
- **Expo Notifications** for push notifications
- **DayJS** for date handling

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI
- iOS Simulator (Mac only) or Android Emulator, or a physical device

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/taskify.git
   cd taskify
   ```

2. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

3. Configure Firebase:
   - Create a Firebase project at [firebase.google.com](https://firebase.google.com)
   - Enable Firestore and Authentication services
   - Update the Firebase configuration in `src/config/firebase.js`

4. Start the development server:
   ```
   npm start
   ```
   or
   ```
   yarn start
   ```

5. Follow the instructions in the terminal to open the app on your device or emulator

## Project Structure

```
src/
├── assets/           # Images, icons, and other static assets
├── components/       # Reusable UI components
├── config/           # Configuration files (Firebase, etc.)
├── hooks/            # Custom React hooks
├── navigation/       # Navigation configuration
├── screens/          # App screens
├── store/            # State management (Zustand)
├── theme/            # Theme configuration and context
└── utils/            # Utility functions
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [Firebase](https://firebase.google.com/)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) 