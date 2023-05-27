import { useEffect, useLayoutEffect } from 'react';
import { useAppContext } from './App.context';
import AppView from './App.view';

function AppController() {
  const { setLoading } = useAppContext();
  // Função para pegar variáveis em modo de debug, sem precisar do portal

  useLayoutEffect(() => {
    setLoading('Renderizando o App...');
  }, []);

  useEffect(() => {
    setLoading('Renderizando o App...', false);
  }, []);

  return <AppView />;
}

export default AppController;
