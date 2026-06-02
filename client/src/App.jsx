import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from './store/gameStore';
import { useSocket } from './hooks/useSocket';
import { HomeScreen } from './components/HomeScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { GameScreen } from './components/GameScreen';
import { WinnerScreen } from './components/WinnerScreen';
import { ErrorToast } from './components/ErrorToast';

const SCREENS = { home: HomeScreen, lobby: LobbyScreen, game: GameScreen, winner: WinnerScreen };

export default function App() {
  const socket = useSocket();
  const { screen, error } = useGameStore();
  const Screen = SCREENS[screen] || HomeScreen;

  // Read ?room= param synchronously on first render so HomeScreen gets it immediately
  const [pendingRoom] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    return room ? room.toUpperCase() : null;
  });

  return (
    <>
      {screen !== 'game' && <ErrorToast message={error} />}
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ width: '100%', height: '100%' }}
        >
          <Screen socket={socket} pendingRoom={pendingRoom} />
        </motion.div>
      </AnimatePresence>
    </>
  );
}
