export default function StatCard({ label, value }:{ label:string; value:string }){
  return (
    <div className="p-3 card">
      <div className="text-xs text-neutral-300">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  )
}
