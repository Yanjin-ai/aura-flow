import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(p){ super(p); this.state={err:null}; }
  static getDerivedStateFromError(err){ return {err}; }
  componentDidCatch(error, info){ console.error("[ErrorBoundary]", error, info); }
  render(){
    if(this.state.err){
      return <div style={{padding:16,fontFamily:"monospace",color:"#b00020"}}>
        <h3>UI 崩溃（ErrorBoundary 捕获）</h3>
        <pre>{String(this.state.err?.stack||this.state.err)}</pre>
      </div>;
    }
    return this.props.children;
  }
}
