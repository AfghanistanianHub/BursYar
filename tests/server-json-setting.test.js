import test from 'node:test';
import assert from 'node:assert/strict';
import {readPrivateSetting} from '../engine/private-config.js';
test('hosted server JSON settings are explicit, bounded and never echo content',async()=>{
 assert.deepEqual(await readPrivateSetting({CONFIG_JSON:'{"meta":{"enabled":true}}'},'CONFIG_FILE','CONFIG_JSON'),{meta:{enabled:true}});
 assert.equal(await readPrivateSetting({},'CONFIG_FILE','CONFIG_JSON'),undefined);
 for(const env of [{CONFIG_FILE:'/unused',CONFIG_JSON:'{}'},{CONFIG_JSON:'PRIVATE_BROKEN_JSON'},{CONFIG_JSON:'x'.repeat(1048577)}])await assert.rejects(readPrivateSetting(env,'CONFIG_FILE','CONFIG_JSON'),e=>!e.message.includes('PRIVATE_BROKEN_JSON'));
});
