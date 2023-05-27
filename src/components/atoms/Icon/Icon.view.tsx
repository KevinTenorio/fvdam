import { IconProps } from './Icon.model';

function IconView({ icon, size, color }: IconProps) {
  switch (icon) {
    case 'jump-to-top':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height={size || '18px'}
          width={size || '18px'}
          fill={color}
          viewBox="0 0 18 18"
        >
          <path d="M11,11v5.5a.5.5,0,0,1-.5.5h-4a.5.5,0,0,1-.5-.5V11H2.5035a.25.25,0,0,1-.177-.427L8.5,4.5l6.173,6.073a.25.25,0,0,1-.177.427Z" />
          <rect height="2" rx="0.25" width="17" y="1" />
        </svg>
      );
    case 'close':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height={size || '18px'}
          width={size || '18px'}
          fill={color}
          viewBox="0 0 18 18"
        >
          <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 18 18" width="18">
            <rect opacity="0" width="18" height="18" />
            <path d="M13.2425,3.343,9,7.586,4.7575,3.343a.5.5,0,0,0-.707,0L3.343,4.05a.5.5,0,0,0,0,.707L7.586,9,3.343,13.2425a.5.5,0,0,0,0,.707l.707.7075a.5.5,0,0,0,.707,0L9,10.414l4.2425,4.243a.5.5,0,0,0,.707,0l.7075-.707a.5.5,0,0,0,0-.707L10.414,9l4.243-4.2425a.5.5,0,0,0,0-.707L13.95,3.343a.5.5,0,0,0-.70711-.00039Z" />
          </svg>
        </svg>
      );
    default:
      return <></>;
  }
}

export default IconView;
