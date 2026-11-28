import style from './LoadingScreen.module.css';

const LoadingScreenView = ({
  loadingMessages,
  onCancel
}: {
  loadingMessages: string[];
  onCancel?: () => void;
}) => {
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
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        flexDirection: 'column',
        color: 'white'
      }}
    >
      <div className={style.loadingSpinner}></div>
      <div role="status" style={{ marginTop: '10px' }}>
        {loadingMessages[0] || 'Loading...'}
      </div>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          style={{ marginTop: '14px', padding: '6px 14px', cursor: 'pointer' }}
        >
          Cancel
        </button>
      )}
    </div>
  );
};

export default LoadingScreenView;
