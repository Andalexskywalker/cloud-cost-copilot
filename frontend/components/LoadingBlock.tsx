
export default function LoadingBlock({ height=180 }:{ height?: number }){
  return (
    <div className="rounded-xl panel animate-pulse" style={{height}} />
  )
}
