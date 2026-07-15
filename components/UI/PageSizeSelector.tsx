interface PageSizeSelectorProps {
  value: number;
  options?: number[];
  onChange: (value: number) => void;
}

export default function PageSizeSelector({
  value,
  options = [5, 10, 25, 50],
  onChange,
}: PageSizeSelectorProps) {
  return (
    <div className="d-flex justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
        <span>Show</span>

        <select
            className="form-select w-auto"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
        >
            {options.map((opt) => (
            <option key={opt} value={opt}>
                {opt}
            </option>
            ))}
        </select>

        <span>entries</span>
        </div>
    </div>
  );
}
