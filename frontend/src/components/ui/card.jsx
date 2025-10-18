export function Card({ className, children }) {
  return (
    <div className={`bg-white rounded-2xl shadow ${className || ""}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children }) {
  return <div className="border-b px-4 py-3">{children}</div>;
}

export function CardTitle({ children }) {
  return <h2 className="font-semibold text-lg">{children}</h2>;
}

export function CardContent({ children }) {
  return <div className="p-4">{children}</div>;
}
