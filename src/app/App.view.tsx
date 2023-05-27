import Home from './Home';
import LoadingScreen from '/src/components/molecules/LoadingScreen';
import ErrorPanel from '/src/components/molecules/ErrorPanel';
import '/src/styles/globals.css';
import '/src/styles/designTokens.css';

function AppView() {
  return (
    <div
      style={{
        position: 'absolute',
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px'
      }}
    >
      <div style={{ width: '100%', height: '100%', backgroundColor: 'grey', display: 'flex' }}>
        <ErrorPanel />
        <LoadingScreen />
        <Home />
      </div>
    </div>
  );
}

export default AppView;
