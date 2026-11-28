import Home from './Home';
import LoadingScreen from '/src/components/molecules/LoadingScreen';
import ErrorPanel from '/src/components/molecules/ErrorPanel';
import '/src/styles/designTokens.css';
import '/src/styles/globals.css';

function AppView() {
  return (
    <>
      <ErrorPanel />
      <LoadingScreen />
      <Home />
    </>
  );
}

export default AppView;
