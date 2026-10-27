import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const rules=readFileSync(new URL('../firestore.rules',import.meta.url),'utf8');
test('public scholarship reads require published status',()=>assert.match(rules,/allow get, list: if resource\.data\.status == 'published'/));
test('client scholarship writes are forbidden',()=>assert.match(rules,/allow create, update, delete: if false/));
test('other documents remain closed by default',()=>assert.match(rules,/match \/\{document=\*\*\}[\s\S]*allow read, write: if false/));
