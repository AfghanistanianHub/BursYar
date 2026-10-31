// Read-only, unauthenticated connectivity probe. No key, model request, source or token.
import tls from 'node:tls';
import {safeTransportCode} from '../engine/provider-config.js';
const started=performance.now(),elapsed=()=>Math.round(performance.now()-started);
const report={mode:'NETWORK_PROBE_NO_INFERENCE',host:'api.meta.ai',phase:'tls_probe',dnsAfterMs:null,tcpAfterMs:null,tlsAfterMs:null,status:null};
try{
 await new Promise((resolve,reject)=>{
  const socket=tls.connect({host:'api.meta.ai',port:443,servername:'api.meta.ai',rejectUnauthorized:true});
  const timer=setTimeout(()=>{socket.destroy();reject(Error('Probe deadline'));},10000);
  const finish=()=>clearTimeout(timer);
  socket.once('lookup',error=>{if(!error)report.dnsAfterMs=elapsed();});
  socket.once('connect',()=>{report.tcpAfterMs=elapsed();});
  socket.once('secureConnect',()=>{report.tlsAfterMs=elapsed();finish();socket.destroy();resolve();});
  socket.once('error',error=>{finish();socket.destroy();reject(error);});
 });
 report.phase='status_probe';
 const statusStart=performance.now();
 const response=await fetch('https://api.meta.ai/v1/status',{redirect:'error',signal:AbortSignal.timeout(10000)});
 report.status=response.status;report.statusHeadersMs=Math.round(performance.now()-statusStart);
 await response.body?.cancel();
 report.passed=response.ok;report.phase='complete';if(!response.ok)process.exitCode=1;
}catch(error){report.passed=false;report.transportCode=safeTransportCode(error);process.exitCode=1;}
console.log(JSON.stringify({...report,totalMs:elapsed(),liveInferenceVerified:false}));
