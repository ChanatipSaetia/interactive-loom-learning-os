import { useCallback } from 'react'

interface RawYAMLEditorProps {
  text: string
  error: string | null
  onChange: (text: string) => void
}

export function RawYAMLEditor({ text, error, onChange }: RawYAMLEditorProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value)
    },
    [onChange]
  )

  return (
    <div className="raw-yaml-editor" data-testid="raw-yaml-editor">
      {error && (
        <div className="raw-yaml-error" data-testid="raw-yaml-error" role="alert">
          {error}
        </div>
      )}
      <textarea
        className="raw-yaml-textarea"
        value={text}
        onChange={handleChange}
        spellCheck={false}
        data-testid="raw-yaml-textarea"
        placeholder="Enter section YAML data..."
      />
    </div>
  )
}
