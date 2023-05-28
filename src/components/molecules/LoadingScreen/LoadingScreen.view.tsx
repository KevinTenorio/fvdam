import style from './LoadingScreen.module.css';

const LoadingScreenView = ({ loadingMessages }: { loadingMessages: string[] }) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: '0px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: '150000',
        backdropFilter: 'blur(2px)',
        flexDirection: 'column',
        color: 'white'
      }}
    >
      <div className={style.loadingSpinner}></div>
      <div style={{ marginTop: '10px' }}>{loadingMessages[0] || 'Loading...'}</div>
    </div>
  );
};

export default LoadingScreenView;
