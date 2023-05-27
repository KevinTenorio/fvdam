import UploadView from './Upload.view';
import { State } from '/src/index.model';

interface UploadControllerProps {
  file: State<any>;
  width: string;
  height: string;
}
function UploadController({ file, width, height }: UploadControllerProps) {
  return <UploadView file={file} width={width} height={height} />;
}

export default UploadController;
