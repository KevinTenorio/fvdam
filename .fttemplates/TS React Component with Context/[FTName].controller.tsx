// No controller fica a lógica do componente
// Importa o view e o context (se precisar) e é exportado para o index

import <FTName>View from './[FTName].view';
import { use[FTName]Context } from "./[FTName].context";
import {I<FTName>ControllerProps} from './[FTName].model';
import {useState} from 'react';

function <FTName>Controller({prop= '[FTName]'}: I<FTName>ControllerProps) {
  const {message} = use[FTName]Context();
    const [example, setExample] = useState<string>('OIOIOI ' + prop + message);

  return <<FTName>View example={{state: example, set:setExample}} />;
}

export default <FTName>Controller;
