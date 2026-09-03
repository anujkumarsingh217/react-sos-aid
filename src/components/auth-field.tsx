interface AuthFieldProps {
  id: string;
  label: string;
  type: string;
  placeholder?: string;
  required?: boolean;
}

export function AuthField({ id, label, type, placeholder, required = true }: AuthFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-foreground">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        required={required}

        className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-info focus:outline-none focus:ring-2 focus:ring-info/25"
      />
    </div>
  );
}
