export default function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div className="p-6 text-center text-sm">
            <div className="font-semibold">{title}</div>
            {subtitle && <div className="opacity-70">{subtitle}</div>}
        </div>
    );
}