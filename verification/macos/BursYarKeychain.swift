import Cocoa
import Security

let service = "ai.bursyar.demo"
let account = NSUserName()
let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword,
 kSecAttrService as String: service, kSecAttrAccount as String: account]
func fail(_ code: Int32) -> Never { fputs("BursYar Keychain operation unavailable (\(code)). No credential details logged.\n", stderr); exit(1) }
let mode = CommandLine.arguments.dropFirst().first ?? "status"
if mode == "read" || mode == "status" {
 var q = query
 q[kSecReturnData as String] = mode == "read"
 q[kSecMatchLimit as String] = kSecMatchLimitOne
 if mode == "status" { q[kSecUseAuthenticationUI as String] = kSecUseAuthenticationUIFail }
 var result: CFTypeRef?
 let status = SecItemCopyMatching(q as CFDictionary, &result)
 if status == errSecItemNotFound { exit(44) }
 guard status == errSecSuccess else { fail(status) }
 if mode == "read" {
  guard let data = result as? Data else { fail(-1) }
  // Private pipe to the Node launcher only. Never run this mode in a terminal.
  var info = stat(); guard fstat(STDOUT_FILENO, &info) == 0 && ((info.st_mode & S_IFMT) == S_IFIFO || (info.st_mode & S_IFMT) == S_IFSOCK) else { fail(-2) }
  FileHandle.standardOutput.write(data)
 } else { print("BursYar Keychain entry exists") }
 exit(0)
}
guard mode == "setup" else { fail(-3) }
let app = NSApplication.shared
app.setActivationPolicy(.accessory)
let alert = NSAlert()
alert.messageText = "Save BursYar startup credentials"
alert.informativeText = "Values are saved only in your login Keychain. The existing Firebase file and quota database stay in ~/.bursyar-private. No paid inference runs during setup. Leave the spending checkbox off unless you have verified the hard limit in Meta."
alert.addButton(withTitle: "Save to Keychain")
alert.addButton(withTitle: "Cancel")
let view = NSView(frame: NSRect(x: 0,y: 0,width: 460,height: 230))
func label(_ text: String,_ y: CGFloat) { let field=NSTextField(labelWithString:text);field.frame=NSRect(x:0,y:y,width:460,height:20);view.addSubview(field) }
func field(_ y: CGFloat, secure: Bool=false) -> NSTextField { let f: NSTextField = secure ? NSSecureTextField() : NSTextField();f.frame=NSRect(x:0,y:y,width:460,height:24);view.addSubview(f);return f }
label("Meta API key (masked; never entered in Terminal)",210)
let key=field(183,secure:true)
label("Exact account-enabled Meta model ID",155)
let model=field(128)
label("Verified Meta hard spending limit (USD; optional while disabled)",100)
let amount=field(73)
let confirmed=NSButton(checkboxWithTitle:"I verified this hard limit in my Meta account",target:nil,action:nil)
confirmed.frame=NSRect(x:0,y:35,width:460,height:24);view.addSubview(confirmed)
alert.accessoryView=view
alert.window.initialFirstResponder=key
app.activate(ignoringOtherApps:true)
guard alert.runModal() == .alertFirstButtonReturn else { exit(2) }
let secret=key.stringValue.trimmingCharacters(in:.whitespacesAndNewlines)
let modelID=model.stringValue.trimmingCharacters(in:.whitespacesAndNewlines)
let limit=Double(amount.stringValue)
let enabled=confirmed.state == .on
// No guessed model or silent spending approval.
guard !secret.isEmpty,secret.utf8.count<=4096,!secret.contains("\n"),
 modelID.range(of:"^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,127}$",options:.regularExpression) != nil,
 !enabled || (limit != nil && limit!.isFinite && limit! > 0) else {
 let error=NSAlert();error.messageText="Not saved";error.informativeText="Enter the API key and exact model ID. A checked spending confirmation also requires a positive USD limit.";error.runModal();exit(1)
}
let config: [String: Any] = ["version":1,"metaApiKey":secret,"metaModelId":modelID,
 "spendingConfirmed":enabled,"spendLimitUSD":limit ?? 0,"confirmedAt":enabled ? ISO8601DateFormatter().string(from:Date()):""]
guard let data=try? JSONSerialization.data(withJSONObject:config) else { fail(-4) }
var attributes=query
attributes[kSecValueData as String]=data
attributes[kSecAttrLabel as String]="BursYar local demo startup"
// Default login Keychain; no synchronizable/iCloud or broad trusted-app ACL.
let status=SecItemAdd(attributes as CFDictionary,nil)
if status == errSecDuplicateItem {
 let update=SecItemUpdate(query as CFDictionary,[kSecValueData as String:data] as CFDictionary)
 guard update == errSecSuccess else { fail(update) }
} else if status != errSecSuccess { fail(status) }
key.stringValue=""
print("Saved in macOS Keychain. Live inference \(enabled ? "enabled under the confirmed account cap" : "disabled until spending is confirmed").")
