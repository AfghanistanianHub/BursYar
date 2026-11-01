// Synthetic, server-owned adult authorization. Never imported by runtime code.
export const adultPolicy={provider:'meta',model:'muse-spark-1.3',userAgeBand:'adult_18_plus',subjectAgeBand:'adult_18_plus',audience:'adult_only',locationDecision:'allowed',consentVerified:true,dataClass:'user_content'};
export const policyContextForRequest=async()=>({...adultPolicy});
