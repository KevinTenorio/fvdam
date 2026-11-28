import { useEffect, useState } from 'react';

// Campo numérico que mostra 0 como "0" e aceita ficar vazio enquanto o usuário digita.
// Antes os campos usavam `value={x || ''}`, que escondia o zero (ex.: Poisson 0, tamanho mínimo 0).
interface NumberFieldProps {
  id: string;
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  error?: string;
  step?: string;
  min?: number;
  style?: React.CSSProperties;
  // valor gravado quando o campo fica vazio (ex.: 0 para coordenadas); sem ele, grava null
  emptyValue?: number;
}

function sameNumber(text: string, value: number | null | undefined, emptyValue?: number) {
  if (text.trim() === '') return value === null || value === undefined || value === emptyValue;
  return Number(text) === value;
}

function NumberField({
  id,
  value,
  onChange,
  error,
  step = 'any',
  min,
  style,
  emptyValue
}: NumberFieldProps) {
  const [text, setText] = useState<string>(
    value === null || value === undefined ? '' : String(value)
  );

  // acompanha mudanças vindas de fora (ex.: abrir um modelo), sem atrapalhar a digitação
  useEffect(() => {
    if (!sameNumber(text, value, emptyValue)) {
      setText(value === null || value === undefined ? '' : String(value));
    }
  }, [value]);

  return (
    <>
      <input
        type="number"
        id={id}
        step={step}
        min={min}
        value={text}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        style={{
          ...(error ? { outline: '2px solid #ff9b9b', outlineOffset: '-1px' } : {}),
          ...style
        }}
        onChange={(event) => {
          const raw = event.target.value;
          setText(raw);
          if (raw.trim() === '') {
            onChange(emptyValue ?? null);
          } else if (!Number.isNaN(Number(raw))) {
            onChange(Number(raw));
          }
        }}
      />
      {error && (
        <div
          id={`${id}-error`}
          role="alert"
          style={{ color: '#ffe0e0', fontSize: '12px', marginTop: '2px' }}
        >
          {error}
        </div>
      )}
    </>
  );
}

export default NumberField;
