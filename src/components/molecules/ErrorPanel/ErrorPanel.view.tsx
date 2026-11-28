import { ErrorPanelProps } from './ErrorPanel.model';
import Icon from '../../atoms/Icon';

function ErrorPanelView({ errorMessage, closeError, errorNumber }: ErrorPanelProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: '0px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: '150000',
        backgroundColor: 'rgba(20, 24, 31, 0.35)'
      }}
    >
      <div
        role="alertdialog"
        aria-labelledby="error-title"
        aria-describedby="error-message"
        className="panel"
        style={{
          width: 'min(520px, calc(100vw - 32px))',
          maxHeight: '80vh',
          overflow: 'auto',
          padding: 0,
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
          borderTop: '4px solid var(--danger)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 12px 0 20px' }}>
          <h2
            id="error-title"
            style={{ margin: 0, flex: 1, fontSize: 'var(--text-lg)', color: 'var(--danger)' }}
          >
            {errorNumber > 1 ? `Error (${errorNumber})` : 'Error'}
          </h2>
          <button
            type="button"
            className="icon-btn"
            aria-label="Close"
            onClick={closeError}
            autoFocus
          >
            <Icon icon="close" size="16px" color="currentColor" />
          </button>
        </div>
        <div id="error-message" style={{ padding: '8px 20px 20px', whiteSpace: 'pre-wrap' }}>
          {(errorMessage as any) instanceof Error ? (errorMessage as any).message : errorMessage}
        </div>
      </div>
    </div>
  );
}

export default ErrorPanelView;
