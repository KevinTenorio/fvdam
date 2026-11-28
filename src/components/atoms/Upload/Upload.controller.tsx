import UploadView from './Upload.view';
import { IState } from '/src/index.model';

interface UploadControllerProps {
  file: IState<any>;
  width: string;
  height: string;
  accept?: string;
}
function UploadController({ file, width, height, accept }: UploadControllerProps) {
  return <UploadView file={file} width={width} height={height} accept={accept} />;
}

export default UploadController;
