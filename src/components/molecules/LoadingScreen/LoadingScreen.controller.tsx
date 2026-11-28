import LoadingScreenView from './LoadingScreen.view';
import { useAppContext } from '/src/app/App.context';

const LoadingScreenController = () => {
  const { loadingMessages, cancelLoading } = useAppContext();
  return (
    <>
      {loadingMessages.length > 0 && (
        <LoadingScreenView loadingMessages={loadingMessages} onCancel={cancelLoading} />
      )}
    </>
  );
};

export default LoadingScreenController;
