export default function LoadingBlock({ height = 180 }: { height?: number }) {
    return (
        <div className="animate-pulse rounded border">
            <div style={{ height }} className="bg-gray-100" />
        </div>
    );
}