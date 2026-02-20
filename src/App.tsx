import { useApp } from './context/AppContext';
import HomeScreen from './screens/HomeScreen';
import CameraScreen from './screens/CameraScreen';
import IdentifyScreen from './screens/IdentifyScreen';
import WizardScreen from './screens/WizardScreen';
import ResultScreen from './screens/ResultScreen';
import SettingsScreen from './screens/SettingsScreen';

function AppRouter() {
  const { screen } = useApp();

  switch (screen) {
    case 'home':
      return <HomeScreen />;
    case 'camera':
      return <CameraScreen />;
    case 'identify':
      return <IdentifyScreen />;
    case 'wizard':
      return <WizardScreen />;
    case 'result':
      return <ResultScreen />;
    case 'settings':
      return <SettingsScreen />;
    default:
      return <HomeScreen />;
  }
}

export default function App() {
  return (
    <div className="h-full">
      <AppRouter />
    </div>
  );
}
