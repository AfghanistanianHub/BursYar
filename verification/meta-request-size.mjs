import {buildMetaRequest,metaReservationUnits} from '../engine/meta-request.js';
// Offline, synthetic sizing only. This never reads a credential or sends a request.
import {evidencePrompt} from '../engine/evidence.js';
import {MAX_COMPLETION_TOKENS} from '../engine/provider-config.js';
const cases=[['historical_oxford_length_ascii_example',5098,'x'],['maximum_source_ascii',12000,'x'],['maximum_source_three_byte_unicode',12000,'\u0800'],['maximum_source_json_escape_heavy',12000,'\\']];
console.log(JSON.stringify({mode:'OFFLINE_SYNTHETIC_REQUEST_SIZING',exactFailedRequestRecorded:false,modelForSizing:'muse-spark-1.3 (fixed sizing model; no live call)',cases:cases.map(([name,length,char])=>{const text=char.repeat(length),messages=evidencePrompt({text,language:'en'});return {name,sourceCodeUnits:text.length,sourceBytes:Buffer.byteLength(text),messagesBytes:Buffer.byteLength(JSON.stringify(messages)),requestBytes:Buffer.byteLength(JSON.stringify(buildMetaRequest('muse-spark-1.3',messages))),maxCompletionTokens:MAX_COMPLETION_TOKENS,reservationUnits:metaReservationUnits('muse-spark-1.3',messages)};})},null,2));
