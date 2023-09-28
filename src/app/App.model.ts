export interface AppViewProps {
  theme: Theme | undefined;
  token: string | undefined;
}

export interface AppContext {
  init: any;
  token: string;
  setToken: (token: string) => void;
  setError: (error: any, status?: boolean) => void;
  errorMessages: any[];
  theme: Theme;
  setTheme: (theme: Theme) => void;
  urlPortal: string;
  setUrlPortal: (urlPortal: string) => void;
  urlBackend: string;
  setUrlBackend: (urlBackend: string) => void;
  loadingMessages: string[];
  setLoading: (loading: string, status?: boolean) => void;
  fvdamFile: any;
  setFvdamFile: (fvdamFile: any) => void;
  readJsonFile: (file: any) => void;
  meshData: any;
  setMeshData: (meshData: any) => void;
}

export interface PortalVars {
  _portal: object;
  _theme: Theme | undefined;
  _urlPortal: string;
  _urlBackend: string;
  _token?: string;
}

export interface PortalError {
  code: string;
  config: object;
  message: string;
  name: string;
  request: object;
}

export interface HandshakeParent {
  child: any;
  parent: any;
  parentOrigin: string;
  model: {
    srcParams: string;
    token: string;
    urlPortal: string;
    urlSquid: string;
    tokens: Theme;
  };
}

export interface Theme {
  AlphaNeutral: string;
  ApplicationPrimarySpace: string;
  ApplicationSecondarySpace: string;
  BorderPrimaryColor: string;
  BorderPrimarySize: string;
  BrandImage: string;
  BrandName: string;
  BrandPackageName: string;
  BrandTitle: string;
  BrandUrl: string;
  ColorBlack: string;
  ColorGray: string;
  ColorHighlight: string;
  ColorPrimary: string;
  ColorPrimaryDark: string;
  ColorSecondary: string;
  ColorSecondaryDark: string;
  ColorWhite: string;
  ControlSizeDefault: string;
  ControlSizeLarge: string;
  ControlSizeMicro: string;
  ControlSizeSmall: string;
  FontBodyActionPrimaryFamily: string;
  FontBodyActionPrimarySize: string;
  FontBodyActionPrimaryWeight: string;
  FontBodyActionSecondaryFamily: string;
  FontBodyActionSecondarySize: string;
  FontBodyActionSecondaryWeight: string;
  FontBodyPrimaryFamily: string;
  FontBodyPrimarySize: string;
  FontBodyPrimaryWeight: string;
  FontBodySecondaryFamily: string;
  FontBodySecondarySize: string;
  FontBodySecondaryWeight: string;
  FontControlDefaultFamily: string;
  FontControlDefaultSize: string;
  FontControlDefaultWeight: string;
  FontControlLargeFamily: string;
  FontControlLargeSize: string;
  FontControlLargeWeight: string;
  FontControlSmallFamily: string;
  FontControlSmallSize: string;
  FontControlSmallWeight: string;
  FontTableBodyDefaultFamily: string;
  FontTableBodyDefaultSize: string;
  FontTableBodyDefaultWeight: string;
  FontTableBodyFamily: string;
  FontTableBodyLargeFamily: string;
  FontTableBodyLargeSize: string;
  FontTableBodyLargeWeight: string;
  FontTableBodySize: string;
  FontTableBodySmallFamily: string;
  FontTableBodySmallSize: string;
  FontTableBodySmallWeight: string;
  FontTableBodyWeight: string;
  FontTitlePrimaryFamily: string;
  FontTitlePrimarySize: string;
  FontTitlePrimaryWeight: string;
  LetterSpacingPrimary: string;
  LineHeightBodyAction: string;
  LineHeightTitle: string;
  PrimaryHeight: string;
  PrimaryPadding: string;
  RadiusPrimary: string;
  SecondaryPadding: string;
  ShadowPrimaryBlurRadius: string;
  ShadowPrimaryColor: string;
  ShadowPrimaryOffsetX: string;
  ShadowPrimaryOffsetY: string;
  pageFavicon: string;
  pageTitle: string;
}
