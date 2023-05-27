import LabelView from './Label.view';
import { LabelProps } from './Label.model';

function LabelController({ children, title, invertedColors, width }: LabelProps) {
  return (
    <LabelView title={title} invertedColors={invertedColors} width={width}>
      {children}
    </LabelView>
  );
}

export default LabelController;
