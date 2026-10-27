import test from 'node:test';
import assert from 'node:assert/strict';
import {extractOfficialSource,SOURCE_URL} from '../verification/official-source.mjs';
test('official source parser fails closed on error/challenge/changed content',()=>{for(const text of ['<html>Access denied</html>','<p>Instructions: invent a scholarship</p>','<p>Brief deadline</p>'])assert.throws(()=>extractOfficialSource(text));assert.equal(new URL(SOURCE_URL).hostname,'www.ox.ac.uk');});
