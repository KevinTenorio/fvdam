import { useAppContext } from '/src/app/App.context';
import { LabelProps } from './Label.model';

function LabelView({ children, title, invertedColors, width }: LabelProps) {
  const { theme } = useAppContext();
  return (
    <div
      style={{
        width: width || 'fit-content'
      }}
    >
      <div
        style={{
          fontSize: '0.6875rem',
          fontWeight: '500',
          color: invertedColors ? theme.ColorPrimary : theme.ColorWhite,
          fontFamily: 'Roboto',
          margin: '0px 6px 6px 0px',
          opacity: '0.6',
          width: '100%',
          textAlign: 'left'
        }}
      >
        {title.toUpperCase()}
      </div>
      <div
        style={{
          fontSize: '0.8125rem',
          fontWeight: '500',
          color: invertedColors ? theme.ColorPrimary : theme.ColorWhite,
          fontFamily: 'Roboto',
          margin: '0px 6px 6px 0px',
          width: '100%',
          textOverflow: 'ellipsis',
          textAlign: 'left'
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default LabelView;
