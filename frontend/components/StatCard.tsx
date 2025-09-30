export default function StatCard({ label, value }:{ label:string; value:string }){
    return (
        <div className="p-3 border rounded">
            <div className="text-xs opacity-70">{label}</div>
            <div className="text-lg font-semibold">{value}</div>
        </div>
    )
}