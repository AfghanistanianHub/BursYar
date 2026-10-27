import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {isAbsolute} from 'node:path';
export class QuotaExceeded extends Error {}
export class QuotaStore {
  constructor(path, limits) {
    if (!isAbsolute(path)) throw new Error('Absolute quota database path required');
    for (const key of ['userMinute','userDay','globalDay','lifetimeUnits']) if(!Number.isSafeInteger(limits[key]) || limits[key]<1) throw new Error('Invalid quota limits');
    this.limits=limits;
    this.db=new DatabaseSync(path);
    this.db.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS quota (bucket TEXT PRIMARY KEY, used INTEGER NOT NULL CHECK(used >= 0));');
  }
  reserve(uid, units, now=Date.now()) {
    if(typeof uid!=='string' || !uid || !Number.isSafeInteger(units) || units<1 || !Number.isSafeInteger(now) || now<0)throw new Error('Invalid reservation');
    const subject=createHash('sha256').update(uid).digest('hex');
    const day=Math.floor(now/86400000),minute=Math.floor(now/60000);
    const buckets=[['u:'+subject+':m:'+minute,1,this.limits.userMinute],['u:'+subject+':d:'+day,1,this.limits.userDay],['g:d:'+day,1,this.limits.globalDay],['lifetime',units,this.limits.lifetimeUnits]];
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const read=this.db.prepare('SELECT used FROM quota WHERE bucket=?');
      for(const [key,amount,max] of buckets)if((read.get(key)?.used??0)+amount>max)throw new QuotaExceeded('Quota exhausted');
      const add=this.db.prepare('INSERT INTO quota(bucket,used) VALUES(?,?) ON CONFLICT(bucket) DO UPDATE SET used=used+excluded.used');
      for(const [key,amount]of buckets)add.run(key,amount);
      // Keep only the current minute/day; lifetime usage is never pruned.
      for(const {bucket} of this.db.prepare("SELECT bucket FROM quota WHERE bucket != 'lifetime'").all()) {
        if((bucket.includes(':m:') && !bucket.endsWith(':m:'+minute)) || (bucket.includes(':d:') && !bucket.endsWith(':d:'+day)))this.db.prepare('DELETE FROM quota WHERE bucket=?').run(bucket);
      }
      this.db.exec('COMMIT');
    }catch(error){this.db.exec('ROLLBACK');throw error;}
  }
  close(){this.db.close();}
}
