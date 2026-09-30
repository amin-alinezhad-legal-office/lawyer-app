export function OfficeField({
  label,
  name,
  children,
}: {
  label: string;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block" htmlFor={name}>
      <span className="mb-2 block text-sm font-bold">{label}</span>
      {children}
    </label>
  );
}

export function OfficeCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`border border-line bg-white p-5 ${className}`}>{children}</div>;
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="border border-dashed border-line bg-white px-5 py-10 text-sm font-light">{children}</p>;
}
