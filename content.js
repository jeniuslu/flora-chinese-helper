(() => {
  let enabled = true;
  let remoteTranslations = {};
  const originals = new WeakMap();
  const websiteHero = new WeakSet();
  const websiteHeadings = new WeakMap();
  const attrOriginals = new WeakMap();
  const attributes = ['placeholder', 'aria-label', 'title', 'data-placeholder'];
  const excluded = 'script,style,noscript,textarea,input,select,option,[contenteditable]:not([contenteditable="false"]),[role="textbox"],code,pre';
  const translate = value => {
    const match = value.match(/^(\s*)(.*?)(\s*)$/s);
    if (!match) return value;
    let replacement = Object.hasOwn(remoteTranslations, match[2]) ? remoteTranslations[match[2]] : FLORA_ZH[match[2]];
    if (!replacement) {
      const dynamic = match[2].match(/^(Image model|Video model): (.+)$/);
      const resolution = match[2].match(/^Resolution (.+)\. Select next resolution$/);
      const generate = match[2].match(/^Generate (\d+)$/);
      const topUp = match[2].match(/^(Decrease|Increase) automatic top-up by (\$[\d,.]+)$/);
      const limits = match[2].match(/^(Off · )?(\$[\d,.]+) minimum · (\$[\d,.]+) maximum$/);
      const prorated = match[2].match(/^Prorated for (\d+) days? left in this cycle$/);
      const payNow = match[2].match(/^Pay (\$[\d,.]+) now and add (\$[\d,.]+) usage immediately\.$/);
      const payOption = match[2].match(/^Start today Pay (\$[\d,.]+) now and add (\$[\d,.]+) usage immediately\.$/);
      const slideCount = match[2].match(/^(\d+) slides?$/);
      const selectedAssets = match[2].match(/^(\d+) selected$/);
      const addedAssets = match[2].match(/^Added (\d+) assets? to canvas$/);
      const workspaceUsage = match[2].match(/^Workspace usage\. (\d+(?:\.\d+)?)% of your team's included monthly usage used\.$/);
      const runNodes = match[2].match(/^Run (\d+) nodes?$/);
      const bulkGenerate = match[2].match(/^Generate\s*·\s*(\d+) nodes?$/);
      if (slideCount) replacement = `${slideCount[1]} 张幻灯片`;
      else if (selectedAssets) replacement = `已选择 ${selectedAssets[1]} 项`;
      else if (addedAssets) replacement = `已将 ${addedAssets[1]} 个素材添加到画布`;
      else if (workspaceUsage) replacement = `工作区用量：已使用团队每月包含额度的 ${workspaceUsage[1]}%。`;
      else if (runNodes) replacement = `运行 ${runNodes[1]} 个节点`;
      else if (bulkGenerate) replacement = `生成 · ${bulkGenerate[1]} 个节点`;
      else if (prorated) replacement = `按本周期剩余 ${prorated[1]} 天的比例计算`;
      else if (payNow) replacement = `现在支付 ${payNow[1]}，立即增加 ${payNow[2]} 用量额度。`;
      else if (payOption) replacement = `今天开始：现在支付 ${payOption[1]}，立即增加 ${payOption[2]} 用量额度。`;
      else if (topUp) replacement = (topUp[1] === 'Decrease' ? '减少自动充值金额 ' : '增加自动充值金额 ') + topUp[2];
      else if (limits) replacement = (limits[1] ? '关闭 · ' : '') + '最低 ' + limits[2] + ' · 最高 ' + limits[3];
      else if (dynamic) replacement = (dynamic[1] === 'Image model' ? '图片模型：' : '视频模型：') + dynamic[2];
      else if (resolution) replacement = '分辨率 ' + resolution[1] + '。选择下一个分辨率';
      else if (generate) replacement = '生成 ' + generate[1] + ' 张';
      else if (/^Variant \d+ of \d+$/.test(match[2])) replacement = match[2].replace(/^Variant (\d+) of (\d+)$/, '版本 $1 / $2');
      else if (/^\d+ of \d+$/.test(match[2])) replacement = match[2].replace(/^(\d+) of (\d+)$/, '$1 / $2');
      else if (/^\d+% Left$/.test(match[2])) replacement = match[2].replace(/^(\d+)% Left$/, '剩余 $1%');
      else if (/^Queue \d+ active$/.test(match[2])) replacement = match[2].replace(/^Queue (\d+) active$/, '队列：$1 个进行中');
      else if (/^Edited today by .+$/.test(match[2])) replacement = match[2].replace(/^Edited today by (.+)$/, '$1 今天编辑');
      else if (/^Edited (January|February|March|April|May|June|July|August|September|October|November|December) (\d{1,2}), (\d{4}) by (.+)$/.test(match[2])) {
        const d = match[2].match(/^Edited (January|February|March|April|May|June|July|August|September|October|November|December) (\d{1,2}), (\d{4}) by (.+)$/);
        const month = ['January','February','March','April','May','June','July','August','September','October','November','December'].indexOf(d[1]) + 1;
        replacement = `${d[4]} 于 ${d[3]} 年 ${month} 月 ${d[2]} 日编辑`;
      }
      else if (/^(\$[\d,.]+) billed (monthly|quarterly|yearly)$/.test(match[2])) { const bill = match[2].match(/^(\$[\d,.]+) billed (monthly|quarterly|yearly)$/); replacement = bill[1] + ' ' + ({monthly:'按月计费',quarterly:'按季度计费',yearly:'按年计费'}[bill[2]]); }
      else if (/^Resets on (January|February|March|April|May|June|July|August|September|October|November|December) (\d{1,2})(?:st|nd|rd|th) at (.+)$/.test(match[2])) { const d=match[2].match(/^Resets on (January|February|March|April|May|June|July|August|September|October|November|December) (\d{1,2})(?:st|nd|rd|th) at (.+)$/); const month=['January','February','March','April','May','June','July','August','September','October','November','December'].indexOf(d[1])+1; replacement=`于 ${month} 月 ${d[2]} 日 ${d[3]} 重置`; }
      else if (/^Free · \d+ members?$/.test(match[2])) replacement = match[2].replace(/^Free · (\d+) members?$/, '免费版 · $1 位成员');
      else if (location.hostname === 'docs.flora.ai' && /^(\d+) (day|days|month|months|year|years) ago$/.test(match[2])) { const d=match[2].match(/^(\d+) (day|days|month|months|year|years) ago$/); replacement=d[1]+({day:' 天前',days:' 天前',month:' 个月前',months:' 个月前',year:' 年前',years:' 年前'}[d[2]]); }
      else if (/^(\d+) (minute|minutes|hour|hours|day|days) ago$/.test(match[2])) { const d=match[2].match(/^(\d+) (minute|minutes|hour|hours|day|days) ago$/); replacement=d[1]+({minute:' 分钟前',minutes:' 分钟前',hour:' 小时前',hours:' 小时前',day:' 天前',days:' 天前'}[d[2]]); }
      else if (/^Adds (\$[\d,.]+) below (\$[\d,.]+), up to (\$[\d,.]+) per billing period\.$/.test(match[2])) { const m=match[2].match(/^Adds (\$[\d,.]+) below (\$[\d,.]+), up to (\$[\d,.]+) per billing period\.$/); replacement=`余额低于 ${m[2]} 时充值 ${m[1]}，每个计费周期最多 ${m[3]}。`; }
      else if (/^(\$[\d,.]+) usage\/seat\/month$/.test(match[2])) replacement=match[2].replace(/^(\$[\d,.]+) usage\/seat\/month$/, '每席位每月包含 $1 用量额度');
      else if (/^(\d+) of (\d+) seats? used · (\d+) available$/.test(match[2])) replacement=match[2].replace(/^(\d+) of (\d+) seats? used · (\d+) available$/, '已使用 $1 / $2 个席位 · 剩余 $3 个');
      else if (/^\d+ active$/.test(match[2])) replacement = match[2].replace(/^(\d+) active$/, '$1 个进行中');
      else if (/^\d+% used$/.test(match[2])) replacement = match[2].replace(/^(\d+)% used$/, '已使用 $1%');
      else if (/^\d+ of \d+ seats? used$/.test(match[2])) replacement = match[2].replace(/^(\d+) of (\d+) seats? used$/, '已使用 $1 / $2 个席位');
      else if (/^\d+ seats? available$/.test(match[2])) replacement = match[2].replace(/^(\d+) seats? available$/, '剩余 $1 个席位');
      else if (/^(Image|Video|Document) (\d+)\/(\d+)$/.test(match[2])) { const m = match[2].match(/^(Image|Video|Document) (\d+)\/(\d+)$/); replacement = ({Image:'图片',Video:'视频',Document:'文档'}[m[1]]) + ' ' + m[2] + '/' + m[3]; }
      else if (/^\d+% off$/.test(match[2])) replacement = match[2].replace(/^(\d+)% off$/, '优惠 $1%');
      else if (/^Quarterly \d+% off$/.test(match[2])) replacement = match[2].replace(/^Quarterly (\d+)% off$/, '按季度（优惠 $1%）');
      else if (/^Yearly \d+% off$/.test(match[2])) replacement = match[2].replace(/^Yearly (\d+)% off$/, '按年（优惠 $1%）');

    }
    return replacement ? match[1] + replacement + match[3] : value;
  };
  function text(node) {
    const parent = node.parentElement;
    if (!parent || parent.closest(excluded)) return;
    if (!enabled) {
      const original = originals.get(node);
      if (original && node.nodeValue === original.translated) node.nodeValue = original.source;
      originals.delete(node);
      return;
    }
    const prior = originals.get(node);
    const source = prior && node.nodeValue === prior.translated ? prior.source : node.nodeValue;
    let translated = translate(source);
    // FLORA may render the bulk heading as several text nodes. Limit this
    // fragment handling to the generation heading so node titles remain intact.
    const bulkHeading = parent.closest('h1,h2,h3,h4,h5,h6,[role="heading"]');
    if (bulkHeading && /(?:Generate|生成)/.test(bulkHeading.textContent)) {
      const fragment = source.match(/^(\s*)·\s*(\d+) nodes?(\s*)$/);
      const count = source.match(/^(\s*)(\d+) nodes?(\s*)$/);
      if (fragment) translated = `${fragment[1]}· ${fragment[2]} 个节点${fragment[3]}`;
      else if (count) translated = `${count[1]}${count[2]} 个节点${count[3]}`;
    }
    const heading = parent.closest('h1,h2');
    const wordMap = heading && websiteHeadings.get(heading);
    if (wordMap && parent.closest('[data-reveal-word]') && wordMap[source.trim()]) translated = source.replace(source.trim(), wordMap[source.trim()]);
    const hero = parent.closest('h1');
    if (hero && websiteHero.has(hero)) {
      const parts = {'Your':'你的','creative':'创意','workspace':'工作空间'};
      const part = source.trim();
      if (parts[part]) translated = source.replace(part, parts[part]);
    }
    if (source.trim() === '. Automatic top-ups are capped at $') {
      translated = (parent.textContent.includes("we'll add") || parent.textContent.includes('时，自动充值'))
        ? '。每个计费周期的自动充值上限为 $' : '时，将自动充值。每个计费周期的自动充值上限为 $';
    } else if (source.trim() === 'month' && parent.textContent.includes('per billing period, which resets each') || source.trim() === 'month' && parent.textContent.includes('上限每')) {
      translated = '个月重置';
    } else if (source.trim() === 'year' && (parent.textContent.includes('per billing period, which resets each') || parent.textContent.includes('上限每'))) {
      translated = '年重置';
    }
    if (translated !== source) {
      originals.set(node, {source, translated});
      if (node.nodeValue !== translated) node.nodeValue = translated;
    }
  }
  function element(el) {
    if ((location.hostname === 'flora.ai' || location.hostname === 'www.flora.ai') && (el.tagName === 'H1' || el.tagName === 'H2')) {
      const maps = {"Your team's new all-in-one creative solution":{Your:'你的',"team's":'团队',new:'全新','all-in-one':'一站式',creative:'创意',solution:'解决方案'},'Everything you need to create':{Everything:'创作',you:'所',need:'需',to:'的',create:'一切'},'Any questions?':{Any:'有','questions?':'疑问？'}};
      const key = el.textContent.trim().replace(/\s+/g, ' ');
      if (maps[key]) websiteHeadings.set(el, maps[key]);
    }
    if ((location.hostname === 'flora.ai' || location.hostname === 'www.flora.ai') && el.tagName === 'H1' && el.textContent.trim() === 'Your creative workspace') websiteHero.add(el);
    if (el.closest('script,style,noscript,code,pre')) return;
    let saved = attrOriginals.get(el) || {};
    for (const name of attributes) {
      const value = el.getAttribute(name);
      if (value === null) continue;
      if (!enabled) {
        if (saved[name] && value === saved[name].translated) el.setAttribute(name, saved[name].source);
        delete saved[name];
      } else {
        const source = saved[name] && value === saved[name].translated ? saved[name].source : value;
        const translated = translate(source);
        if (translated !== source) {
          saved[name] = {source, translated};
          if (value !== translated) el.setAttribute(name, translated);
        }
      }
    }
    attrOriginals.set(el, saved);
  }
  function scan(root) {
    if (root.nodeType === Node.TEXT_NODE) { text(root); return; }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE) element(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeType === Node.TEXT_NODE) text(node); else element(node);
    }
  }
  const pending = new Set();
  let scheduled = false;
  function queue(root) {
    pending.add(root);
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      const roots = [...pending]; pending.clear();
      for (const item of roots) if (item.isConnected) scan(item);
    });
  }
  const observer = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'characterData') { const parent = record.target.parentElement; queue(parent && parent.textContent.includes('自动充值上限') ? parent : record.target); }
      else if (record.type === 'attributes') queue(record.target);
      else for (const node of record.addedNodes) queue(node);
    }
  });
  chrome.storage.local.get({enabled:true, remoteWordlist:null}, result => {
    enabled = result.enabled;
    remoteTranslations = result.remoteWordlist?.translations || {};
    observer.observe(document.documentElement, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:attributes});
    scan(document.documentElement);
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes.enabled || changes.remoteWordlist)) {
      if (changes.enabled) enabled = changes.enabled.newValue !== false;
      if (changes.remoteWordlist) remoteTranslations = changes.remoteWordlist.newValue?.translations || {};
      scan(document.documentElement);
    }
  });
})();
