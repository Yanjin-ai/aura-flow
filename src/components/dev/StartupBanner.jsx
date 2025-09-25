export default function StartupBanner(){
  if(import.meta.env.PROD) return null;
  const info = [
    `ENV: ${import.meta.env.MODE}`,
    `APP_ID: ${import.meta.env.VITE_APP_ID||"(empty)"}`,
    `API_BASE: ${import.meta.env.VITE_API_BASE_URL||"(empty)"}`
  ].join(" | ");
  return (
    <div style={{position:"fixed",top:0,left:0,right:0,zIndex:9999,
      background:"#111",color:"#0f0",fontFamily:"monospace",fontSize:12,padding:"6px 10px",opacity:0.9}}>
      <strong>App Booted</strong> — {info}
    </div>
  );
}
