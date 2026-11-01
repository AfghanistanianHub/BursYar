import test from 'node:test';
import assert from 'node:assert/strict';
import * as config from '../engine/listen-config.js';
test('local startup stays loopback-only by default',()=>{
 assert.equal(typeof config.listenHost,'function');
 assert.equal(config.listenHost({}),'127.0.0.1');
});
test('hosted startup requires an explicit all-interface binding',()=>{
 assert.equal(config.listenHost({BURSYAR_HOST:'0.0.0.0'}),'0.0.0.0');
 assert.equal(config.listenHost({BURSYAR_HOST:'127.0.0.1'}),'127.0.0.1');
 for(const host of ['evil.example','::','', '0.0.0.0:8080'])assert.throws(()=>config.listenHost({BURSYAR_HOST:host}));
});
