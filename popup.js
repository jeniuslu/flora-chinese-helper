const toggle = document.getElementById('enabled');
const button = document.getElementById('update');
const status = document.getElementById('status');
const release = document.getElementById('release');
const notesList = document.getElementById('release-notes');
function showReleaseNotes(wordlist) {
  const notes = Array.isArray(wordlist?.releaseNotes) ? wordlist.releaseNotes.filter(note => typeof note === 'string' && note.trim()).slice(0, 10) : [];
  notesList.replaceChildren(...notes.map(note => {
    const item = document.createElement('li');
    item.textContent = note;
    return item;
  }));
  release.hidden = notes.length === 0;
}
chrome.storage.local.get({enabled:true, remoteWordlist:null}, ({enabled, remoteWordlist}) => {
  toggle.checked = enabled;
  if (remoteWordlist) status.textContent = `当前词库：${remoteWordlist.version}`;
  showReleaseNotes(remoteWordlist);
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.remoteWordlist) showReleaseNotes(changes.remoteWordlist.newValue);
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
