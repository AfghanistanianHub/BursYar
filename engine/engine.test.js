import test from "node:test";
import assert from "node:assert/strict";
import {validateRequest,createPrompt,normalizeModelResponse} from "./engine.js";
const text="The applicant must be enrolled in an undergraduate program and submit an application before December 2026.";
test("validates request bounds and language",()=>{ assert.equal(validateRequest({text,language:"fa"}).language,"fa");assert.throws(()=>validateRequest({text,language:"xx"}));assert.throws(()=>validateRequest({text:"short",language:"ps"})); });
test("handles untrusted content as data",()=>{const x=createPrompt({text,language:"ps"});assert.equal(x.length,2);assert.match(x[0].content,/Do not invent/);assert.match(x[1].content,/SOURCE TEXT/);});
test("model output must follow schema and remain a draft",()=>{const result=normalizeModelResponse(JSON.stringify({summary:"Sample",criteria:["Enrolled student"],deadline:null,uncertainties:["Exact deadline unknown"],sourceLanguage:"en"}));assert.equal(result.requiresHumanReview,true);assert.equal(result.aiGenerated,true);assert.throws(()=>normalizeModelResponse('not json'));});
