// Importa o controller e o context (se tiver), cria o componente com nome geral e o exporta para o resto da aplicação

import [FTName]Controller from './[FTName].controller';
import { [FTName]Provider } from './[FTName].context';

const [FTName] = () => {
    return (
        <[FTName]Provider>
            <[FTName]Controller />
        </[FTName]Provider>
    );
}

export default [FTName];