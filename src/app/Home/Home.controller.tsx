// No controller fica a lógica do componente
// Importa o view e o context (se precisar) e é exportado para o index

import HomeView from './Home.view';

function HomeController() {
  const handleFileRead = (file: any) => {
    const fr = new FileReader();
    fr.onload = (e) => {
      const text = e.target?.result;
      console.log(text);
    };
    fr.readAsText(file);
  };
  return <HomeView handleFileRead={handleFileRead} />;
}

export default HomeController;
