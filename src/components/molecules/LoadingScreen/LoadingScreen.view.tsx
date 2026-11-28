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
        backgroundColor: 'rgba(20, 24, 31, 0.55)',
        flexDirection: 'column',
        color: 'white'
      }}
    >
      <div className={style.loadingSpinner}></div>
      <div role="status" style={{ marginTop: '12px', fontSize: 'var(--text-lg)' }}>
        {loadingMessages[0] || 'Loading...'}
      </div>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-dark"
          style={{ marginTop: '16px' }}
        >
          Cancel
        </button>
      )}
    </div>
  );
};

export default LoadingScreenView;
