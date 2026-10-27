// No answers are sent to the API or persisted. Availability never proves eligibility.
export function findBarriers(criteria, answers = {}) {
  return criteria.map(c=>{
    const missing = ['transcripts','language_test','travel_document'].includes(c.kind) && answers[c.kind] === 'unavailable';
    return {criterionId:c.id,status:missing?'potential mismatch':'cannot determine',action:missing?'Ask the institution whether this requirement applies and which alternatives it explicitly accepts.':'Verify the exact requirement with the institution. Availability alone does not establish eligibility.'};
  });
}
