// No controller fica a lógica do componente
// Importa o view e o context (se precisar) e é exportado para o index

import HomeView from './Home.view';

function HomeController() {
  return <HomeView />;
}

export default HomeController;
