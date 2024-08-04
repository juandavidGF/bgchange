
type Props = {
  label:string, 
  placeholder: string
  placeholderTextArea: string,
  description: string,
  setPrompt: (value: string) => void;
}
export function Prompt({label,description ,placeholder, placeholderTextArea, setPrompt}: Props) {
  return (
    <div className="w-80">
      <label className="block text-sm font-medium leading-6 text-gray-300">
        {label}
      </label>
      <div>
        {description}
      </div>
      <textarea
        className="mt-2 w-full border bg-slate-800 text-sm text-gray-300 leading-6 text-left pl-3 py-1 rounded-md"
        placeholder={placeholderTextArea}
        onChange={(e) => setPrompt(e.target.value)}
      />
    </div>
  )
}