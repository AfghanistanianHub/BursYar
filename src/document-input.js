// Validate before authentication/network work; preserve source text exactly.
const fail=code=>{const error=new Error(code);error.code=code;throw error;};
export async function readDocumentText(file){
 if(!file)fail('missingFile');
 if(!file.name?.toLowerCase().endsWith('.txt'))fail('unsupportedFile');
 if(file.size>12000)fail('fileTooLarge');
 const bytes=new Uint8Array(await file.arrayBuffer());
 if(bytes.byteLength>12000)fail('fileTooLarge');
 let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{fail('invalidEncoding');}
 if(!text.trim())fail('emptyFile');
 if(/[\x00-\x08\x0b\x0c\x0e-\x1f\ufffd]/u.test(text))fail('invalidEncoding');
 return text;
}
