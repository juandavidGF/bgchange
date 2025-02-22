type NumberInputProps = {
  label: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  onChange: (value: number) => void;
};

export function NumberInput({
  label,
  description,
  min = 0,
  max = 100,
  step = 1,
  defaultValue = 50,
  onChange
}: NumberInputProps) {
  return (
    <div className="w-80">
      <label className="block text-sm font-medium leading-6 text-gray-300">
        {label}
      </label>
      {description && (
        <div className="text-sm text-gray-500">
          {description}
        </div>
      )}
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        defaultValue={defaultValue}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 block w-full rounded-md border-0 bg-slate-800 py-1.5 text-gray-300 shadow-sm ring-1 ring-inset ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
      />
    </div>
  );
}

type SliderProps = {
  label: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  onChange: (value: number) => void;
};

export function Slider({
  label, 
  description,
  min = 0,
  max = 100,
  step = 1,
  defaultValue = 50,
  onChange 
}: SliderProps) {
  return (
    <div className="w-80">
      <label className="block text-sm font-medium leading-6 text-gray-300">
        {label}
      </label>
      {description && (
        <div className="text-sm text-gray-500">
          {description}
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        defaultValue={defaultValue}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer mt-2"
      />
      <div className="mt-1 text-xs text-gray-400">
        Value: {defaultValue}
      </div>
    </div>
  );
}

type CheckboxProps = {
  label: string;
  description?: string;
  defaultChecked?: boolean;
  onChange: (checked: boolean) => void;
};

export function Checkbox({
  label,
  description,
  defaultChecked = false,
  onChange
}: CheckboxProps) {
  return (
    <div className="w-80">
      <label className="flex items-center text-sm font-medium text-gray-300">
        <input
          type="checkbox"
          defaultChecked={defaultChecked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 mr-2"
        />
        {label}
      </label>
      {description && (
        <div className="mt-1 text-sm text-gray-500 ml-6">
          {description}
        </div>
      )}
    </div>
  );
}

type CheckboxGroupProps = {
  label: string;
  description?: string;
  options?: string[];
  defaultSelected?: string[];
  onChange: (selected: string[]) => void;
};

export function CheckboxGroup({
  label,
  description,
  options = [],
  defaultSelected = [],
  onChange
}: CheckboxGroupProps) {
  return (
    <div className="w-80">
      <label className="block text-sm font-medium leading-6 text-gray-300">
        {label}
      </label>
      {description && (
        <div className="text-sm text-gray-500">
          {description}
        </div>
      )}
      <div className="mt-2 space-y-2">
        {(options || []).map((option) => (
          <label key={option} className="flex items-center text-sm text-gray-300">
            <input
              type="checkbox"
              defaultChecked={defaultSelected.includes(option)}
              onChange={(e) => {
                const newSelected = e.target.checked
                  ? [...defaultSelected, option]
                  : defaultSelected.filter(item => item !== option);
                onChange(newSelected);
              }}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 mr-2"
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
}

type NumberOutputProps = {
  title?: string;
  value: string | number | null;
};

export function NumberOutput({ title, value }: NumberOutputProps) {
  return (
    <div className="w-80 p-4 rounded-lg border border-gray-600 bg-slate-800">
      <div className="text-sm font-medium text-gray-300 mb-2">
        {title || 'Output Value'}
      </div>
      <div className="text-2xl font-bold text-gray-100">
        {value ?? ''}
      </div>
    </div>
  );
}