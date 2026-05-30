import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from './store/gameStore';
import { useSocket } from './hooks/useSocket';
import { HomeScreen } from './components/HomeScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { GameScreen } from './components/GameScreen';
import { WinnerScreen } from './components/WinnerScreen';
import { ErrorToast } from './components/ErrorToast';

const SCREENS = {
  home: HomeScreen,
  lobby: LobbyScreen,
  game: GameScreen,
  winner: WinnerScreen,
};

export default function App() {
  const socket = useSocket();
  const { screen, error } = useGameStore();

  const Screen = SCREENS[screen] || HomeScreen;

  return (
    <>
      <ErrorToast message={screen !== 'game' ? error : null} />
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{ width: '100%', height: '100%' }}
        >
              <Screen socket={socket} />
        </motion.div>
      </AnimatePresence>
    </>
  );
}
