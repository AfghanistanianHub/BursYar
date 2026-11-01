// Preserve local-only startup unless hosting is explicitly configured.
export function listenHost(env=process.env) {
 const host=env.BURSYAR_HOST??'127.0.0.1';
 if(!['127.0.0.1','0.0.0.0'].includes(host))throw Error('BURSYAR_HOST must be 127.0.0.1 or 0.0.0.0');
 return host;
}
