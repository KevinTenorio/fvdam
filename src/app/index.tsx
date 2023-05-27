import AppController from './App.controller';
import { AppProvider } from './App.context';

const App = () => {
  return (
    <AppProvider>
      <AppController />
    </AppProvider>
  );
};

export default App;
