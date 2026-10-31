import {createInferenceServer as createServer} from '../../engine/http.js';
import {policyContextForRequest} from './policy.js';
// Explicit fixture registration: does not change the production defaults.
export function createInferenceServer(options){
 const {infer,quota}=options;
 const adapter={provider:'meta',model:infer.configuration?.model??'muse-spark-1.3',available:true,infer,reservationUnits:infer.reservationUnits,quota};
 return createServer({...options,policyContextForRequest,providers:{meta:adapter}});
}
