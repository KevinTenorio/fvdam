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
        backdropFilter: 'blur(2px)'
      }}
    >
      <div
        style={{
          width: '550px',
          height: 'min(80%, auto)',
          backgroundColor: 'white',
          border: '1px solid var(--off-white)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div
          style={{
            width: '100%',
            backgroundColor: 'red',
            paddingLeft: '10px',
            paddingRight: '10px',
            textAlign: 'left',
            display: 'flex',
            justifyContent: 'right'
          }}
        >
          <div style={{ width: '100%' }}>{`ERROR ${errorNumber > 1 ? errorNumber : ''}`}</div>

          <div onClick={closeError} style={{ cursor: 'pointer' }}>
            <Icon icon="close" size="18px" color="grey" />
          </div>
        </div>
        <div
          style={{
            width: '100%',
            height: '100%',
            padding: '10px 30px 10px 30px',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {errorMessage}
        </div>
      </div>
    </div>
  );
}

export default ErrorPanelView;
