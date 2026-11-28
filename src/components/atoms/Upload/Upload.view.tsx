import Icon from '/src/components/atoms/Icon';
import { IState } from '/src/index.model';
import './Upload.style.css';

interface UploadViewProps {
  file: IState<any>;
  width: string;
  height: string;
  accept?: string;
}

function UploadView({ file, width, height, accept }: UploadViewProps) {
  return (
    <div
      className="upload"
      style={{ width, height, display: 'flex', alignItems: 'center', cursor: 'pointer' }}
    >
      {file.state ? (
        <div
          style={{
            borderColor: 'rgba(255, 255, 255, 0.3)',
            borderWidth: '0.0625rem',
            borderStyle: 'dashed',
            borderRadius: '0.0625rem',
            backgroundColor: 'rgba(0, 0, 0, 0.08)',
            width: '100%',
            height: '100%'
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <button
              type="button"
              aria-label="Remove file"
              title="Remove file"
              onClick={() => file.set(null)}
              style={{
                cursor: 'pointer',
                background: 'none',
                border: 0,
                padding: 2,
                lineHeight: 0
              }}
            >
              <Icon icon="trash" size="18px" color="white" />
            </button>

            <span
              style={{
                marginTop: '5px',
                color: '#FFFFFFCC',
                fontFamily: 'Roboto',
                fontSize: '0.6875rem',
                fontWeight: '500'
              }}
            >
              {file ? file.state.name : '-'}
            </span>
          </div>
        </div>
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative' }}>
          <input
            type="file"
            name="file"
            accept={accept}
            aria-label="Choose a .json model or .fvt mesh"
            style={{
              opacity: 0,
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              width,
              height,
              cursor: 'pointer'
            }}
            onChange={(event: any) => {
              if (event.target.files.length > 0) {
                const uploadedFile = event.target.files[0];
                file.set(uploadedFile);
              }
            }}
          />
          <div
            style={{
              borderColor: 'rgba(255, 255, 255, 0.3)',
              borderWidth: '0.0625rem',
              borderStyle: 'dashed',
              borderRadius: '0.0625rem',
              backgroundColor: 'rgba(0, 0, 0, 0.08)',
              width: '100%',
              height: '100%'
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <div style={{ cursor: 'pointer' }}>
                <Icon icon="upload" size="18px" color="white" />
              </div>
              <span
                style={{
                  marginTop: '5px',
                  color: '#FFFFFFCC',
                  fontFamily: 'Roboto',
                  fontSize: '0.6875rem',
                  fontWeight: '500'
                }}
              >
                Drop or click to open a .json or .fvt file
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadView;
