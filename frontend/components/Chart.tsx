"use client"

type Pt = { x:number; y:number }
type Series = { name:string; points:Pt[] }

function scale(v:number, min:number, max:number, size:number){
  if (max === min) return size/2
  return ((v - min) / (max - min)) * size
}

export default function Chart({ series, w=700, h=240 }: { series:Series[]; w?:number; h?:number }){
  if (!series.length) return <div className="p-4 border rounded">No data</div>
  const pad=24, W=w-pad*2, H=h-pad*2
  const allY = series.flatMap(s=>s.points.map(p=>p.y))
  const allX = series.flatMap(s=>s.points.map(p=>p.x))
  const minY=Math.min(...allY), maxY=Math.max(...allY)
  const minX=Math.min(...allX), maxX=Math.max(...allX)
  return (
    <svg width={w} height={h} className="border rounded bg-white">
      <g transform={`translate(${pad},${pad})`}>
        <line x1={0} y1={H} x2={W} y2={H} stroke="currentColor" opacity="0.2"/>
        <line x1={0} y1={0} x2={0} y2={H} stroke="currentColor" opacity="0.2"/>
        {series.map((s,i)=>{
          const d = s.points.map((p,idx)=>{
            const x=scale(p.x,minX,maxX,W), y=H-scale(p.y,minY,maxY,H)
            return `${idx?'L':'M'}${x},${y}`
          }).join(" ")
          return <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={2}/>
        })}
        <text x={0} y={-6} fontSize="10">{maxY.toFixed(0)}</text>
        <text x={0} y={H+12} fontSize="10">{minY.toFixed(0)}</text>
      </g>
    </svg>
  )
}
