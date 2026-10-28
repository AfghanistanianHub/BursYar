import Cocoa
import Security

let service = "ai.bursyar.demo"
let account = NSUserName()
let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword,
 kSecAttrService as String: service, kSecAttrAccount as String: account]
func fail(_ code: Int32) -> Never { fputs("BursYar Keychain operation unavailable (\(code)). No credential details logged.\n", stderr); exit(1) }
func loadRecord() -> [String: Any]? {
 var q=query; q[kSecReturnData as String]=true; q[kSecMatchLimit as String]=kSecMatchLimitOne
 var result: CFTypeRef?; let status=SecItemCopyMatching(q as CFDictionary,&result)
 if status == errSecItemNotFound { return nil }
 guard status == errSecSuccess else { fail(status) }
 guard let data=result as? Data, let record=(try? JSONSerialization.jsonObject(with:data)) as? [String:Any],record["version"] as? Int == 1 else { fail(-4) }
 return record
}
func encode(_ record: [String:Any]) -> Data {
 guard let data=try? JSONSerialization.data(withJSONObject:record) else { fail(-4) }; return data
}
func limitValue(_ input:String) -> Double? {
 var text=input.trimmingCharacters(in:.whitespacesAndNewlines)
 if text.hasPrefix("$") { text=String(text.dropFirst()).trimmingCharacters(in:.whitespaces) }
 guard text.range(of:"^[0-9]+(\\.[0-9]{1,2})?$",options:.regularExpression) != nil,
 let amount=Double(text),amount.isFinite,amount>0 else { return nil };return amount
}
func patchSpending(_ original: [String:Any],_ amount:Double,_ timestamp:String) -> [String:Any] {
 // Copy the existing record; never replace/re-enter the API key, model or other fields.
 var record=original;record["spendLimitUSD"]=amount;record["spendingConfirmed"]=true;record["confirmedAt"]=timestamp;return record
}
func safeStatus(_ record: [String:Any]) -> [String:Any] {
 let enabled=record["spendingConfirmed"] as? Bool ?? false
 let amount=record["spendLimitUSD"] as? Double ?? 0
 let timestamp=record["confirmedAt"] as? String ?? ""
 return ["schemaVersion":record["version"] as? Int ?? -1,
 "credentialFieldPresent":record.keys.contains("metaApiKey"),"modelFieldPresent":record.keys.contains("metaModelId"),
 "spendingConfirmed":enabled,"spendLimitUSD":amount.isFinite ? amount:0,
 "confirmationTimestampValid":ISO8601DateFormatter().date(from:timestamp) != nil,
 "liveInferenceVerified":false]
}
func update(_ record:[String:Any]) {
 let status=SecItemUpdate(query as CFDictionary,[kSecValueData as String:encode(record)] as CFDictionary)
 guard status == errSecSuccess else { fail(status) }
}
let mode = CommandLine.arguments.dropFirst().first ?? "status"
if mode == "self-test" {
 let before:[String:Any] = ["version":1,"metaApiKey":"FAKE_TEST_ONLY","metaModelId":"test-model","spendLimitUSD":0,"spendingConfirmed":false,"confirmedAt":"","extra":"retain"]
 let after=patchSpending(before,5,"2026-10-27T00:00:00Z")
 precondition(after["metaApiKey"] as? String == before["metaApiKey"] as? String)
 precondition(after["metaModelId"] as? String == before["metaModelId"] as? String)
 precondition(after["extra"] as? String == "retain")
 precondition(safeStatus(after)["spendingConfirmed"] as? Bool == true)
 precondition(safeStatus(after)["spendLimitUSD"] as? Double == 5)
 precondition(safeStatus(after)["confirmationTimestampValid"] as? Bool == true)
 precondition(limitValue("$5") == 5 && limitValue("5.00") == 5)
 for invalid in ["0","-5","NaN","Infinity","5junk","5,00",""] { precondition(limitValue(invalid) == nil) }
 let safe=String(data:encode(safeStatus(after)),encoding:.utf8)!
 precondition(!safe.contains("FAKE_TEST_ONLY") && !safe.contains("test-model"))
 print("Native attestation update/redaction tests passed; no Keychain access or inference.");exit(0)
}
if mode == "status" {
 var q=query;q[kSecReturnData as String]=false;q[kSecMatchLimit as String]=kSecMatchLimitOne
 q[kSecUseAuthenticationUI as String]=kSecUseAuthenticationUIFail
 let status=SecItemCopyMatching(q as CFDictionary,nil)
 if status == errSecItemNotFound { exit(44) };guard status == errSecSuccess else { fail(status) }
 print("BursYar Keychain entry exists");exit(0)
}
if mode == "read" || mode == "diagnose" || mode == "confirm-spending" {
 guard let original=loadRecord() else { exit(44) }
 var record=original
 if mode == "confirm-spending" {
  guard CommandLine.arguments.count == 3,let amount=limitValue(CommandLine.arguments[2]) else { fail(-5) }
  let alreadyConfirmed=original["spendingConfirmed"] as? Bool == true && original["spendLimitUSD"] as? Double == amount && ISO8601DateFormatter().date(from:original["confirmedAt"] as? String ?? "") != nil
  if !alreadyConfirmed {record=patchSpending(original,amount,ISO8601DateFormatter().string(from:Date()));update(record)}
  // Read back and verify only the non-secret attestation fields; never print original data.
  guard let saved=loadRecord(),saved["spendingConfirmed"] as? Bool == true,saved["spendLimitUSD"] as? Double == amount,
   saved["confirmedAt"] as? String == record["confirmedAt"] as? String else { fail(-6) }
  record=saved
 }
 if mode == "read" {
  var info=stat();guard fstat(STDOUT_FILENO,&info) == 0 && ((info.st_mode & S_IFMT) == S_IFIFO || (info.st_mode & S_IFMT) == S_IFSOCK) else { fail(-2) }
  FileHandle.standardOutput.write(encode(record))
 }else if mode == "confirm-spending" {
  print(String(data:encode(["event":"spending_attestation_checked","previous":safeStatus(original),"saved":safeStatus(record)]),encoding:.utf8)!)
 }else{print(String(data:encode(safeStatus(record)),encoding:.utf8)!)}
 exit(0)
}
guard mode == "setup" else { fail(-3) }
// Preserve prior values on reopening setup. Never prefill or display the saved API key.
let previous=loadRecord()
let app=NSApplication.shared;app.setActivationPolicy(.accessory)
let alert=NSAlert();alert.messageText="Save BursYar startup credentials"
alert.informativeText="Values are saved only in login Keychain. Leave the key blank to retain a saved key. Spending confirmation refers to your verified Meta hard account limit; no inference runs during setup."
alert.addButton(withTitle:"Save to Keychain");alert.addButton(withTitle:"Cancel")
let view=NSView(frame:NSRect(x:0,y:0,width:460,height:230))
func label(_ text:String,_ y:CGFloat){let f=NSTextField(labelWithString:text);f.frame=NSRect(x:0,y:y,width:460,height:20);view.addSubview(f)}
func field(_ y:CGFloat,secure:Bool=false)->NSTextField{let f:NSTextField=secure ? NSSecureTextField():NSTextField();f.frame=NSRect(x:0,y:y,width:460,height:24);view.addSubview(f);return f}
label("Meta key (masked; leave blank to retain saved key)",210);let key=field(183,secure:true)
label("Exact account-enabled Meta model ID",155);let model=field(128)
model.stringValue=previous?["metaModelId"] as? String ?? ""
label("Verified Meta hard spending limit (USD)",100);let amount=field(73)
if let saved=previous?["spendLimitUSD"] as? Double,saved>0 { amount.stringValue=String(saved) }
let confirmed=NSButton(checkboxWithTitle:"I verified this hard limit in my Meta account",target:nil,action:nil)
confirmed.state=(previous?["spendingConfirmed"] as? Bool == true) ? .on:.off
confirmed.frame=NSRect(x:0,y:35,width:460,height:24);view.addSubview(confirmed)
alert.accessoryView=view;alert.window.initialFirstResponder=key;app.activate(ignoringOtherApps:true)
guard alert.runModal() == .alertFirstButtonReturn else { exit(2) }
// Commit any active Cocoa field editor before reading the amount/model controls.
alert.window.makeFirstResponder(nil)
let entered=key.stringValue.trimmingCharacters(in:.whitespacesAndNewlines)
let modelID=model.stringValue.trimmingCharacters(in:.whitespacesAndNewlines)
let limit=limitValue(amount.stringValue);let enabled=confirmed.state == .on
var record=previous ?? ["version":1]
if !entered.isEmpty {record["metaApiKey"]=entered}
guard record.keys.contains("metaApiKey"),entered.utf8.count<=4096,!entered.contains("\n"),
 modelID.range(of:"^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,127}$",options:.regularExpression) != nil,
 !enabled || limit != nil else {
 let error=NSAlert();error.messageText="Not saved";error.informativeText="A new record requires an API key. Enter the exact model ID and a positive USD limit when confirmation is checked. Existing credentials are unchanged.";error.runModal();exit(1)
}
record["metaModelId"]=modelID;record["spendingConfirmed"]=enabled;record["spendLimitUSD"]=limit ?? 0
record["confirmedAt"]=enabled ? ISO8601DateFormatter().string(from:Date()):""
if previous != nil {update(record)}else{
 var attributes=query;attributes[kSecValueData as String]=encode(record);attributes[kSecAttrLabel as String]="BursYar local demo startup"
 let status=SecItemAdd(attributes as CFDictionary,nil);guard status == errSecSuccess else { fail(status) }
}
key.stringValue=""
print("Saved in macOS Keychain. Live inference \(enabled ? "enabled under the confirmed account cap":"disabled until spending is confirmed").")
