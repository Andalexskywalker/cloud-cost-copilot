export default function EmptyState({ title, subtitle }:{ title:string; subtitle?:string }){
  return (
    <div className="text-center py-10 text-sm">
      <div className="font-semibold">{title}</div>
      {subtitle && <div className="opacity-70">{subtitle}</div>}
    </div>
  )
}
