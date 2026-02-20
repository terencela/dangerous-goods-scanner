import { useApp } from './context/AppContext';
import HomeScreen from './screens/HomeScreen';
import CameraScreen from './screens/CameraScreen';
import IdentifyScreen from './screens/IdentifyScreen';
import WizardScreen from './screens/WizardScreen';
import ResultScreen from './screens/ResultScreen';

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
