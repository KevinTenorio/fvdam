// No view fica o que é renderizado pelo componente
// Importa o styles (se tiver) e outros componentes filhos
// É exportado para o controller
import { useAppContext } from '../App.context';
import { AppContext } from '../App.model';

function HomeView() {
  const { setError }: AppContext = useAppContext();

  const Content = () => {
    try {
      return <div style={{ width: '50px', height: '50px', backgroundColor: 'red' }}>OIOIOIOI</div>;
    } catch (error) {
      setError(error);
      return <></>;
    }
  };

  return <Content />;
}

export default HomeView;
