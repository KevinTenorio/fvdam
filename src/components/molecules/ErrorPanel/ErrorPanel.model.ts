export interface ErrorPanelProps {
  errorMessage: JSX.Element | string;
  closeError: () => void;
  errorNumber: number;
}
