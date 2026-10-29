const toggle = document.getElementById('enabled');
const button = document.getElementById('update');
const status = document.getElementById('status');
const release = document.getElementById('release');
const notesList = document.getElementById('release-notes');
const history = document.getElementById('history');
const historyList = document.getElementById('history-list');
let bundledWordlist = null;
let currentWordlist = null;
function showReleaseNotes(wordlist) {
  // Older cached copies may lack the new metadata. Use the bundled metadata
  // only when it describes the same dictionary version.
  const fallback = wordlist?.version === bundledWordlist?.version ? bundledWordlist : null;
  const notes = wordlist?.releaseNotes ?? fallback?.releaseNotes;
  const entries = wordlist?.updateHistory ?? fallback?.updateHistory;
  const validNotes = Array.isArray(notes) ? notes.filter(note => typeof note === 'string' && note.trim()).slice(0, 10) : [];
  notesList.replaceChildren(...validNotes.map(note => {
    const item = document.createElement('li'); item.textContent = note; return item;
  }));
  release.hidden = validNotes.length === 0;
  const validHistory = Array.isArray(entries) ? entries.filter(item => typeof item?.version === 'string' && typeof item?.summary === 'string').slice(0, 30) : [];
  historyList.replaceChildren(...validHistory.map(entry => {
    const item = document.createElement('li');
    const title = document.createElement('strong'); title.textContent = entry.version + '：';
    item.append(title, document.createTextNode(entry.summary)); return item;
  }));
  history.hidden = validHistory.length === 0;
}
chrome.storage.local.get({enabled:true, remoteWordlist:null}, ({enabled, remoteWordlist}) => {
  toggle.checked = enabled;
  currentWordlist = remoteWordlist;
  if (remoteWordlist) status.textContent = `当前词库：${remoteWordlist.version}`;
  showReleaseNotes(currentWordlist);
});
fetch(chrome.runtime.getURL('wordlist.json')).then(response => response.json()).then(data => {
  bundledWordlist = data;
  showReleaseNotes(currentWordlist || bundledWordlist);
}).catch(() => {});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.remoteWordlist) {
    currentWordlist = changes.remoteWordlist.newValue;
    showReleaseNotes(currentWordlist);
  }
});
toggle.addEventListener('change', () => chrome.storage.local.set({enabled:toggle.checked}));
button.addEventListener('click', async () => {
  button.disabled = true;
  status.textContent = '正在检查词库…';
  try {
    const result = await chrome.runtime.sendMessage({type:'update-wordlist'});
    status.textContent = result.ok ? (result.changed ? `词库已更新：${result.version}` : `词库已是最新：${result.version}`) : `更新失败，请稍后重试（${result.error}）`;
  } catch { status.textContent = '更新失败，请稍后重试'; }
  button.disabled = false;
});
