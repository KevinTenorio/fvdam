// No view fica o que é renderizado pelo componente
// Importa o styles (se tiver) e outros componentes filhos
// É exportado para o controller
import { useAppContext } from '../App.context';
import { AppContext } from '../App.model';
import Upload from '/src/components/atoms/Upload';

interface HomeViewProps {
  handleFileRead: (file: any) => void;
}
function HomeView({ handleFileRead }: HomeViewProps) {
  const { setError, fvdamFile, setFvdamFile }: AppContext = useAppContext();

  const Content = () => {
    try {
      return (
        <div style={{ width: '100%', height: '100%' }}>
          <div
            style={{
              padding: '20px',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column'
            }}
          >
            <Upload file={{ state: fvdamFile, set: setFvdamFile }} width="200px" height="50px" />
            {fvdamFile && (
              <button
                style={{ marginTop: '20px', cursor: 'pointer' }}
                onClick={() => handleFileRead(fvdamFile)}
              >
                Iniciar
              </button>
            )}
          </div>
        </div>
      );
    } catch (error) {
      setError(error);
      return <></>;
    }
  };

  return <Content />;
}

export default HomeView;
