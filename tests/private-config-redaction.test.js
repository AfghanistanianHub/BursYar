import assert from 'node:assert/strict';
import {mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';
import {readPrivateSetting} from '../engine/private-config.js';

test('file-backed private JSON reports malformed input without disclosing contents', async t => {
 const dir=await mkdtemp(join(tmpdir(),'bursyar-private-'));
 t.after(()=>rm(dir,{recursive:true,force:true}));
 const path=join(dir,'config.json');
 await writeFile(path,'secret-example-invalid',{mode:0o600});
 const load=()=>readPrivateSetting({CONFIG:path},'CONFIG','CONFIG_JSON');
 await assert.rejects(load,{message:'Invalid private JSON configuration'});
 await writeFile(path,'{"enabled":false}');
 assert.deepEqual(await load(),{enabled:false});
});
