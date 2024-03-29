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
    case 'download':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height={size || '18px'}
          width={size || '18px'}
          fill={color}
          viewBox="0 0 18 18"
        >
          <path d="M12,10V1.5a.5.5,0,0,0-.5-.5h-5a.5.5,0,0,0-.5.5V10H2.5035a.25.25,0,0,0-.177.427L9,17.1l6.673-6.673A.25.25,0,0,0,15.4965,10Z" />
        </svg>
      );
    case 'upload':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height={size || '18px'}
          width={size || '18px'}
          fill={color}
          viewBox="0 0 18 18"
        >
          <path d="M12,8v8.5a.5.5,0,0,1-.5.5h-5a.5.5,0,0,1-.5-.5V8H2.5035a.25.25,0,0,1-.177-.427L9,.9l6.673,6.673A.25.25,0,0,1,15.496,8Z" />
        </svg>
      );
    case 'trash':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height={size || '18px'}
          width={size || '18px'}
          fill={color}
          viewBox="0 0 18 18"
        >
          <path d="M15.75,3H12V2a1,1,0,0,0-1-1H6A1,1,0,0,0,5,2V3H1.25A.25.25,0,0,0,1,3.25v.5A.25.25,0,0,0,1.25,4h1L3.4565,16.55a.5.5,0,0,0,.5.45H13.046a.5.5,0,0,0,.5-.45L14.75,4h1A.25.25,0,0,0,16,3.75v-.5A.25.25,0,0,0,15.75,3ZM5.5325,14.5a.5.5,0,0,1-.53245-.46529L5,14.034l-.5355-8a.50112.50112,0,0,1,1-.067l.5355,8a.5.5,0,0,1-.46486.53283ZM9,14a.5.5,0,0,1-1,0V6A.5.5,0,0,1,9,6ZM11,3H6V2h5Zm1,11.034a.50112.50112,0,0,1-1-.067l.5355-8a.50112.50112,0,1,1,1,.067Z" />
        </svg>
      );
    case 'zoom-in':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height={size || '18px'}
          width={size || '18px'}
          fill={color}
          viewBox="0 0 18 18"
        >
          <rect fill="#ff13dc" opacity="0" width="18" height="18" />
          <path d="M10.75,7H9V5.25A.25.25,0,0,0,8.75,5H7.25A.25.25,0,0,0,7,5.25V7H5.25A.25.25,0,0,0,5,7.25v1.5A.25.25,0,0,0,5.25,9H7v1.75a.25.25,0,0,0,.25.25h1.5A.25.25,0,0,0,9,10.75V9h1.75A.25.25,0,0,0,11,8.75V7.25A.25.25,0,0,0,10.75,7Z" />
          <path d="M17.587,16.1075,13.628,12.15a7.0155,7.0155,0,1,0-1.478,1.4785l3.958,3.958a1.05,1.05,0,0,0,1.479-1.479ZM3,8a5,5,0,1,1,5,5A5,5,0,0,1,3,8Z" />
        </svg>
      );
    case 'zoom-out':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height={size || '18px'}
          width={size || '18px'}
          fill={color}
          viewBox="0 0 18 18"
        >
          <rect opacity="0" width="18" height="18" />
          <rect height="2" rx="0.25" width="6" x="5" y="7" />
          <path d="M17.587,16.1075,13.628,12.15a7.0155,7.0155,0,1,0-1.478,1.4785l3.958,3.958a1.05,1.05,0,0,0,1.479-1.479ZM3,8a5,5,0,1,1,5,5A5,5,0,0,1,3,8Z" />
        </svg>
      );
    case 'refresh':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height={size || '18px'}
          width={size || '18px'}
          fill={color}
          viewBox="0 0 18 18"
        >
          <rect opacity="0" width="18" height="18" />
          <path d="M16.337,10H15.39a.6075.6075,0,0,0-.581.469A5.7235,5.7235,0,0,1,5.25,13.006l-.346-.3465L6.8815,10.682A.392.392,0,0,0,7,10.4a.4.4,0,0,0-.377-.4H1.25a.25.25,0,0,0-.25.25v5.375A.4.4,0,0,0,1.4,16a.3905.3905,0,0,0,.28-.118l1.8085-1.8085.178.1785a8.09048,8.09048,0,0,0,3.642,2.1655,7.715,7.715,0,0,0,9.4379-5.47434q.04733-.178.0861-.35816A.5.5,0,0,0,16.337,10Z" />
          <path d="M16.6,2a.3905.3905,0,0,0-.28.118L14.5095,3.9265l-.178-.1765a8.09048,8.09048,0,0,0-3.642-2.1655A7.715,7.715,0,0,0,1.25269,7.06072q-.04677.17612-.08519.35428A.5.5,0,0,0,1.663,8H2.61a.6075.6075,0,0,0,.581-.469A5.7235,5.7235,0,0,1,12.75,4.994l.346.3465L11.1185,7.318A.392.392,0,0,0,11,7.6a.4.4,0,0,0,.377.4H16.75A.25.25,0,0,0,17,7.75V2.377A.4.4,0,0,0,16.6,2Z" />
        </svg>
      );
    case 'chevron':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height={size || '18px'}
          width={size || '18px'}
          fill={color}
          viewBox="0 0 18 18"
        >
          <rect opacity="0" width="18" height="18" />
          <path d="M12,9a.994.994,0,0,1-.2925.7045l-3.9915,3.99a1,1,0,1,1-1.4355-1.386l.0245-.0245L9.5905,9,6.3045,5.715A1,1,0,0,1,7.691,4.28l.0245.0245,3.9915,3.99A.994.994,0,0,1,12,9Z" />
        </svg>
      );
    case 'copy':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 18 18"
          height={size || '18px'}
          width={size || '18px'}
          fill={color}
        >
          <rect id="Canvas" fill={color} opacity="0" width="18" height="18" />
          <rect height="1" rx="0.25" width="1" x="16" y="11" />
          <rect height="1" rx="0.25" width="1" x="16" y="9" />
          <rect height="1" rx="0.25" width="1" x="16" y="7" />
          <rect height="1" rx="0.25" width="1" x="16" y="5" />
          <rect height="1" rx="0.25" width="1" x="16" y="3" />
          <rect height="1" rx="0.25" width="1" x="16" y="1" />
          <rect height="1" rx="0.25" width="1" x="14" y="1" />
          <rect height="1" rx="0.25" width="1" x="12" y="1" />
          <rect height="1" rx="0.25" width="1" x="10" y="1" />
          <rect height="1" rx="0.25" width="1" x="8" y="1" />
          <rect height="1" rx="0.25" width="1" x="6" y="1" />
          <rect height="1" rx="0.25" width="1" x="6" y="3" />
          <rect height="1" rx="0.25" width="1" x="6" y="5" />
          <rect height="1" rx="0.25" width="1" x="6" y="7" />
          <rect height="1" rx="0.25" width="1" x="6" y="9" />
          <rect height="1" rx="0.25" width="1" x="6" y="11" />
          <rect height="1" rx="0.25" width="1" x="8" y="11" />
          <rect height="1" rx="0.25" width="1" x="10" y="11" />
          <rect height="1" rx="0.25" width="1" x="12" y="11" />
          <rect height="1" rx="0.25" width="1" x="14" y="11" />
          <path d="M5,6H1.5a.5.5,0,0,0-.5.5v10a.5.5,0,0,0,.5.5h10a.5.5,0,0,0,.5-.5V13H5.5a.5.5,0,0,1-.5-.5Z" />
        </svg>
      );
    case 'support':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 18 18"
          height={size || '18px'}
          width={size || '18px'}
          fill={color}
        >
          <path d="M2.65,15.1245l5.45-5.036a.505.505,0,0,1,.714,0l5.536,5.036a.505.505,0,0,1-.357.862H3.006a.505.505,0,0,1-.356-.862Z" />
        </svg>
      );
    default:
      return <></>;
  }
}

export default IconView;
