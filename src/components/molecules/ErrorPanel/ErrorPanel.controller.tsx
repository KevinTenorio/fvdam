import ErrorPanelView from './ErrorPanel.view';
import { useAppContext } from '/src/app/App.context';

function generalCatchMessage(err: any) {
  if (err?.response) {
    let text = err?.response?.data?.message || err?.message;
    if (typeof err?.response?.data?.message === 'object') {
      text = Object.keys(err?.response?.data?.message).map((key) => {
        return <span key={key}>{err?.response?.data?.message[key] + ' (' + key + ')\n'}</span>;
      });
    }
    if (typeof err?.message === 'object') {
      text = Object.keys(err?.message).map((key) => {
        return (
          <span key={key}>
            <span style={{ fontWeight: 'bold' }}>{'- Error ' + key + ': '}</span>

            {err?.message[key] + '\n'}
          </span>
        );
      });
    }
    return (
      <div style={{ whiteSpace: 'pre-wrap', textAlign: 'center' }}>
        <span key={err.response}>
          <span style={{ fontWeight: 'bold' }}>{'- Error [' + err?.response?.status + ']: '}</span>
          {text}
        </span>
      </div>
    );
  } else if (err?.request?.response) {
    return <span>{err.request.response}</span>;
  } else if (err?.message) {
    return <span>{err?.message}</span>;
  } else {
    return (
      <div style={{ whiteSpace: 'pre-wrap', textAlign: 'center' }}>
        {Object.keys(err).map((key) => {
          return (
            <span key={key}>
              <span style={{ fontWeight: 'bold' }}>{'- Error ' + key + ': '}</span>

              {err[key] + '\n'}
            </span>
          );
        })}
      </div>
    );
  }
}

function ErrorPanelController() {
  const { errorMessages, setError } = useAppContext();
  return (
    <>
      {errorMessages.length > 0 && (
        <ErrorPanelView
          errorNumber={errorMessages.length}
          errorMessage={
            typeof errorMessages[0] === 'object'
              ? generalCatchMessage(errorMessages[0])
              : errorMessages[0] || 'Algo inesperado aconteceu.'
          }
          closeError={() => setError(errorMessages[0], false)}
        />
      )}
    </>
  );
}

export default ErrorPanelController;
