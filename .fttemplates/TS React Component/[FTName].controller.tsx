// No controller fica a lógica do componente
// Importa o view e o context (se precisar) e é exportado para o index

import <FTName>View from './[FTName].view';
import {I<FTName>ControllerProps} from './[FTName].model';
import {useState} from 'react';

function <FTName>Controller({prop= '[FTName]'}: I<FTName>ControllerProps) {
    const [example, setExample] = useState<string>('OIOIOI ' + prop);
  return <<FTName>View example={{state: example, set:setExample}} />;
}

export default <FTName>Controller;
