const toggle = document.getElementById('enabled');
const button = document.getElementById('update');
const status = document.getElementById('status');
chrome.storage.local.get({enabled:true, remoteWordlist:null}, ({enabled, remoteWordlist}) => {
  toggle.checked = enabled;
  if (remoteWordlist) status.textContent = `当前词库：${remoteWordlist.version}`;
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
