// No view fica o que é renderizado pelo componente
// Importa o styles (se tiver) e outros componentes filhos
// É exportado para o controller
import { I<FTName>ViewProps } from './[FTName].model';
import './[FTName].styles.css';

function <FTName>View ({example}: I<FTName>ViewProps) {
    return (
            <div className='example'>
                {example.state}
            </div>
    );
}

export default <FTName>View;
