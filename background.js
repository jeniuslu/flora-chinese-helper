const WORDLIST_URL = 'https://raw.githubusercontent.com/jeniuslu/flora-chinese-helper/main/wordlist.json';
const MAX_BYTES = 1024 * 1024;
let inFlight;

async function updateWordlist() {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(WORDLIST_URL, {cache:'no-store', signal:controller.signal});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = await response.text();
      if (body.length > MAX_BYTES) throw new Error('词库文件过大');
      const data = JSON.parse(body);
      if (data.format !== 1 || typeof data.version !== 'string' || data.version.length > 80 || !data.translations || typeof data.translations !== 'object' || Array.isArray(data.translations)) throw new Error('词库格式不正确');
      const entries = Object.entries(data.translations);
      if (!entries.length || entries.length > 10000 || entries.some(([key,value]) => !key || key.length > 4000 || typeof value !== 'string' || value.length > 4000)) throw new Error('词库内容不正确');
      const previous = await chrome.storage.local.get('remoteWordlist');
      const changed = JSON.stringify(previous.remoteWordlist?.translations) !== JSON.stringify(data.translations);
      await chrome.storage.local.set({remoteWordlist:data, wordlistCheckedAt:Date.now()});
      return {ok:true, changed, version:data.version};
    } catch (error) {
      return {ok:false, error:error.message || '网络连接失败'};
    } finally { clearTimeout(timer); }
  })();
  try { return await inFlight; } finally { inFlight = null; }
}
chrome.runtime.onInstalled.addListener(() => { chrome.alarms.create('wordlist-update', {periodInMinutes:360}); updateWordlist(); });
chrome.runtime.onStartup.addListener(() => { chrome.alarms.create('wordlist-update', {periodInMinutes:360}); updateWordlist(); });
chrome.alarms.onAlarm.addListener(alarm => { if (alarm.name === 'wordlist-update') updateWordlist(); });
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'update-wordlist' || sender.id !== chrome.runtime.id) return;
  updateWordlist().then(sendResponse);
  return true;
});
