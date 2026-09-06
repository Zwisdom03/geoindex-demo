/* Precomputed results only. No network search, analytics, or third-party assets. */
(() => {
  'use strict';
  const data = window.GEOINDEX_DATA;
  if (!data || !Array.isArray(data.queries) || !data.queries.length) {
    document.getElementById('results-status').textContent = 'The saved dataset could not be loaded. Please reload this page.';
    return;
  }
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cats = {
    all: ['All examples', '全部'], entity: ['Entities', '实体'], combination: ['Combinations', '实体组合'],
    spatial: ['Spatial relations', '空间关系'], activity: ['Activities', '动态活动'], quantity: ['Quantity', '数量意图']
  };
  const dictionary = {
    showcase:['RETRIEVAL SHOWCASE','检索结果展示'],methodLink:['About this demo','关于本演示'],
    badge:['PRECOMPUTED RESEARCH DEMO','预计算研究演示'],title:['Explore scenes.<br>Inspect the evidence.','探索遥感场景。<br>追溯检索依据。'],
    subtitle:['Remote-sensing retrieval through entities, spatial relationships, and activities. Select an example to explore its saved results.','通过实体、空间关系与动态活动检索遥感影像。选择一条示例查询，查看真实运行后保存的结果。'],
    notice:['These results were computed offline with GeoIndex. This page does not run live searches.','结果已由 GeoIndex 在本地预先计算。本页面不执行实时检索。'],
    collection:['LRS-GRO · RETRIEVAL COLLECTION','LRS-GRO · 遥感影像检索集'],examples:['01 / EXAMPLE QUERIES','01 / 示例查询'],
    filterLabel:['Filter saved examples','筛选已保存的示例'],sidebarNote:['English titles are translations for navigation. Every retrieval query was executed in Chinese.','英文标题仅用于浏览和理解。所有检索均使用所显示的中文原始查询执行。'],
    resultsLabel:['02 / SAVED RETRIEVAL RESULTS','02 / 已保存的检索结果'],downloadQuery:['Query JSON ↗','下载查询 JSON ↗'],
    scoreNote:['Ranking score ≠ probability','排序得分 ≠ 概率'],parsedQuery:['Inspect the parsed query','查看查询解析结果'],
    methodLabel:['03 / DATA & REPRODUCIBILITY','03 / 数据与可复现信息'],methodTitle:['A transparent snapshot of retrieval.','透明、可追溯的检索快照。'],
    methodA:['What you are viewing','展示的是什么'],methodAText:['Selected queries run against the existing BGE-M3 and FAISS index, with structured entity, relationship, and evidence scoring. The original top-ranked candidates are retained, including partial matches.','示例使用现有 BGE-M3 与 FAISS 索引，结合结构化实体、关系和证据评分进行检索。保留原始排名靠前的候选结果，包括部分匹配。'],
    methodB:['How to read the results','如何理解检索结果'],methodBText:['Scores are ranking signals, not calibrated confidence. The strict-match indicator is a rule-based diagnostic, not human validation. Explanations summarize retrieved metadata and evidence; they are not new image annotations.','分数是排序信号，并非经过校准的置信度。严格匹配指示来自规则诊断，不代表人工验证。解释来自检索到的元数据与证据，不是重新对影像生成的标注。'],
    methodC:['Scope of this demonstration','演示的范围'],methodCText:['This is a curated demonstration, not an aggregate evaluation. Images are resized RGB previews. Selecting examples is local to your browser and does not contact a retrieval server.','本页面展示选定示例，不构成整体性能评估。图片为缩放后的 RGB 预览图。切换示例完全在浏览器中完成，无需连接检索服务器。'],
    downloadAll:['Download all results','下载全部结果'],provenance:['Export provenance','下载来源记录'],
    footer:['Evidence-aware remote-sensing retrieval','基于结构化证据的遥感影像检索'],offline:['Static demonstration · No live inference','静态演示 · 无实时推理'],detailLabel:['RESULT INSPECTOR','结果详情']
  };
  const scoreNames = {final:['Final ranking','最终排序'],semantic:['Semantic','语义'],keyword:['Keyword','关键词'],category:['Category','类别'],relation:['Relation','关系'],evidence_layer:['Evidence layer','证据层'],scene:['Scene context','场景上下文'],quantity:['Quantity','数量']};
  const initial = new URLSearchParams(location.hash.slice(1));
  let lang = initial.get('lang') === 'zh' ? 'zh' : 'en';
  let current = data.queries.find(q => q.id === initial.get('q')) || data.queries.find(q => q.id === 'coastal-port') || data.queries[0];
  let category = 'all';
  let selectedImage = null;
  let returnFocus = null;
  const localized = pair => pair[lang === 'en' ? 0 : 1];
  const t = key => localized(dictionary[key]);
  const categoryName = key => localized(cats[key] || [key,key]);
  const score = number => Number(number || 0).toFixed(4);
  const queryName = query => lang === 'en' ? query.en : query.query;
  function updateHash() {
    const p = new URLSearchParams({q:current.id,lang});
    if (selectedImage) p.set('image',selectedImage);
    history.replaceState(null,'',`#${p.toString()}`);
  }
  function tag(text, kind = '') { return `<span class="tag ${kind}">${esc(text)}</span>`; }
  function applyLanguage() {
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    document.title = lang === 'en' ? 'GeoIndex · Retrieval Showcase' : 'GeoIndex · 预计算检索展示';
    document.querySelectorAll('[data-i18n]').forEach(el => {
      if (el.dataset.i18n === 'title') el.innerHTML = t('title');
      else el.textContent = t(el.dataset.i18n);
    });
    $('language').textContent = lang === 'en' ? '中文' : 'EN';
    $('language').setAttribute('aria-label',lang === 'en' ? '切换为中文' : 'Switch to English');
    $('query-filter').placeholder = lang === 'en' ? 'Filter saved examples…' : '筛选已保存的示例…';
    $('close-dialog').setAttribute('aria-label',lang === 'en' ? 'Close result details' : '关闭结果详情');
    const m = data.meta;
    $('collection-strip').innerHTML = [
      `<span><strong>${m.image_count.toLocaleString('en-US')}</strong>${lang === 'en' ? 'indexed images' : '张已索引影像'}</span>`,
      `<span><strong>${m.document_count.toLocaleString('en-US')}</strong>${lang === 'en' ? 'structured documents' : '条结构化文档'}</span>`,
      `<span><strong>${m.query_count}</strong>${lang === 'en' ? 'saved queries' : '条预计算查询'}</span>`,
      '<span><strong>BGE-M3</strong> + FAISS</span>'
    ].join('');
    $('provenance-summary').textContent = `${lang === 'en' ? 'Exported' : '导出时间'} ${m.generated_at.slice(0,10)} (UTC) · Top-${m.top_k} · ${lang === 'en' ? 'Semantic recall' : '语义召回'} ${m.top_m} · ${m.unique_result_images} ${lang === 'en' ? 'unique result images' : '张独立结果影像'}`;
  }
  function renderQueries() {
    $('categories').innerHTML = Object.keys(cats).map(key => `<button type="button" data-category="${key}" aria-pressed="${key === category}">${esc(categoryName(key))}</button>`).join('');
    const term = $('query-filter').value.trim().toLowerCase();
    const shown = data.queries.filter(q => (category === 'all' || q.category === category) && `${q.query} ${q.en} ${q.id}`.toLowerCase().includes(term));
    $('example-count').textContent = `${shown.length} / ${data.queries.length}`;
    $('query-list').innerHTML = shown.length ? shown.map(q => `<button type="button" class="query-button" data-query="${q.id}" aria-pressed="${q.id === current.id}"><span class="query-name">${esc(queryName(q))}</span><span class="query-type">${esc(categoryName(q.category))} · ${q.results.length} ${lang === 'en' ? 'saved results' : '条结果'}</span></button>`).join('') : `<p class="empty">${lang === 'en' ? 'No saved examples match this filter. This field filters examples; it does not run a new query.' : '没有符合筛选条件的已保存示例。此输入框仅筛选示例，不执行新查询。'}</p>`;
  }
  function renderResults() {
    const q = current;
    $('query-title').textContent = queryName(q);
    $('query-original').textContent = `${lang === 'en' ? 'Executed query (Chinese)' : '实际执行的中文查询'}: ${q.query}`;
    $('query-category').textContent = categoryName(q.category);
    $('query-download').href = `data/queries/${q.id}.json`;
    $('query-summary').textContent = lang === 'en'
      ? `${q.results.length} ranked candidates saved. ${q.strict_result_count} pass the rule-based strict-match check. Candidates that fail this check are retained for inspection.`
      : `已保存 ${q.results.length} 条排序结果，其中 ${q.strict_result_count} 条通过基于规则的严格匹配检查。未通过检查的候选仍保留，供核查。`;
    const entities = q.requirements.entities.map(item => tag(`${item.field}: ${item.value}`));
    const relations = q.requirements.relations.map(item => tag([item.subject,item.relation,item.object].filter(Boolean).join(' → '),'relation'));
    if (q.parsed_query.quantity_intent?.enabled) relations.push(tag(lang === 'en' ? 'Quantity-aware ranking' : '数量意图参与排序','relation'));
    $('query-conditions').innerHTML = entities.concat(relations).join('');
    $('results-status').textContent = lang === 'en' ? `Top ${q.results.length} · Original retrieval order` : `前 ${q.results.length} 条 · 保留原始检索顺序`;
    $('result-grid').innerHTML = q.results.length ? q.results.map(r => {
      const passed = r.strict_match?.passed === true;
      const name = esc(r.image_name);
      return `<article class="result-card"><button type="button" class="image-button" data-image="${name}" aria-label="${esc(lang === 'en' ? 'Inspect '+r.image_name : '查看 '+r.image_name)}"><img src="${esc(r.thumbnail)}" alt="${name}" loading="lazy" width="640" height="640"><span class="rank">#${r.rank}</span><span class="image-action">${lang === 'en' ? 'VIEW SCENE ↗' : '查看影像 ↗'}</span></button><div class="card-content"><div class="card-heading"><h3>${name}</h3><span class="score" title="${esc(String(r.scores.final))}">${score(r.scores.final)}</span></div><div class="card-tags">${(r.matched.area_categories.length ? r.matched.area_categories : r.matched.keywords).slice(0,3).map(value => tag(value)).join('')}</div><p class="card-description">${esc(r.description)}</p><div class="card-bottom"><span class="match-status ${passed ? 'pass' : ''}">${lang === 'en' ? (passed ? 'Strict check passed' : 'Partial / strict check failed') : (passed ? '严格检查通过' : '部分匹配 / 严格检查未通过')}</span><button type="button" class="detail-button" data-image="${name}">${lang === 'en' ? 'Evidence →' : '查看证据 →'}</button></div></div></article>`;
    }).join('') : `<p class="empty">${lang === 'en' ? 'No candidates were returned for this saved query.' : '该预计算查询未返回候选影像。'}</p>`;
    $('parsed-query').textContent = JSON.stringify({parsed_query:q.parsed_query,query_profile:q.query_profile,local_retrieval_ms:q.elapsed_ms,timing_note:data.meta.timing},null,2);
  }
  function reasonsFor(r) {
    if (lang === 'zh') return r.reasons;
    const reasons = [];
    if (r.matched.keywords.length) reasons.push(`Matched entities or keywords: ${r.matched.keywords.join(', ')}.`);
    if (r.matched.relations.length) reasons.push(`Matched relationship labels: ${r.matched.relations.join(', ')}.`);
    if (r.scores.relation >= .75) reasons.push('The rule-based relationship score is at least 0.75.');
    else if (r.scores.relation > 0) reasons.push('Some relationship evidence contributed to the ranking.');
    if (r.scores.evidence_layer >= .75) reasons.push('The evidence-layer score is at least 0.75.');
    else if (r.scores.evidence_layer > 0) reasons.push('Some supporting evidence contributed to the ranking.');
    if (r.scores.scene >= .5) reasons.push('The scene-context score is at least 0.5.');
    if (!reasons.length) reasons.push('The candidate is primarily supported by semantic retrieval; structured evidence is limited.');
    return reasons;
  }
  function renderDetail(r) {
    $('detail-title').textContent = `#${r.rank} / ${r.image_name}`;
    const s = r.strict_match || {};
    const passed = s.passed === true;
    const scores = Object.keys(scoreNames).filter(key => key in r.scores).map(key => `<div class="score-row"><span>${esc(localized(scoreNames[key]))}</span><div class="score-track"><div class="score-fill" style="width:${Math.max(0,Math.min(100,Number(r.scores[key])*100))}%"></div></div><span class="score-value" title="${esc(String(r.scores[key]))}">${score(r.scores[key])}</span></div>`).join('');
    let diagnostic = lang === 'en' ? (passed ? 'Passed the rule-based strict-match check.' : 'Did not pass all rule-based strict-match conditions.') : (passed ? '通过基于规则的严格匹配检查。' : '未通过全部基于规则的严格匹配条件。');
    if (!passed) {
      const missing = [...(s.missing_entities || []).map(x=>`${x.field}=${x.value}`),...(s.missing_relations || []).map(x=>[x.subject,x.relation,x.object].filter(Boolean).join(' ')),...(s.score_reasons || [])];
      if (missing.length) diagnostic += ` ${lang === 'en' ? 'Unmet conditions' : '未满足条件'}: ${missing.join('; ')}`;
    }
    const evidence = r.evidence.length ? r.evidence.map(e => `<blockquote><span class="evidence-type">${esc([e.doc_type,e.relation].filter(Boolean).join(' / '))}</span>${esc(e.evidence)}</blockquote>`).join('') : `<p>${lang === 'en' ? 'No textual supporting evidence was exported for this candidate.' : '该候选没有导出文字支撑证据。'}</p>`;
    const descriptionTitle = lang === 'en' ? 'Source description' : '原始描述';
    $('detail-content').innerHTML = `<div class="detail-layout"><div class="detail-visual"><img src="${esc(r.preview)}" alt="${esc(r.image_name)}"><p class="image-meta">${r.width} × ${r.height} ${lang === 'en' ? 'source pixels · resized RGB preview' : '原始像素 · 缩放 RGB 预览'}</p><div class="detail-links"><a class="button secondary" href="${esc(r.preview)}" download>${lang === 'en' ? 'Download preview' : '下载预览图'}</a><a class="button secondary" href="data/queries/${current.id}.json" download>${lang === 'en' ? 'Query + evidence JSON' : '查询与证据 JSON'}</a></div><section class="detail-section"><h3>${descriptionTitle}</h3><p>${esc(r.description)}</p></section><section class="detail-section"><h3>${lang === 'en' ? 'Matched entities & relationships' : '命中的实体与关系'}</h3><div class="card-tags">${r.matched.keywords.concat(r.matched.relations).map(value=>tag(value)).join('') || '—'}</div></section></div><div class="detail-analysis"><div class="diagnostic ${passed ? 'pass' : ''}">${esc(diagnostic)}</div><section class="detail-section"><h3>${lang === 'en' ? 'Score breakdown' : '评分分项'}</h3>${scores}<p class="image-meta">${lang === 'en' ? 'Displayed to four decimal places. Exact numeric values are preserved in the JSON. These components are not a simple unweighted sum.' : '显示四位小数，JSON 保留原始数值。最终排序得分不是这些分项的简单相加。'}</p></section><section class="detail-section"><h3>${lang === 'en' ? 'Why this candidate was retrieved' : '为什么检索到此候选'}</h3><ul class="reason-list">${reasonsFor(r).map(reason=>`<li>${esc(reason)}</li>`).join('')}</ul></section><section class="detail-section"><h3>${lang === 'en' ? 'Supporting evidence · original text' : '支撑证据 · 原文'}</h3>${evidence}</section></div></div>`;
  }
  function openDetail(imageName, trigger) {
    const r = current.results.find(item => item.image_name === imageName);
    if (!r) return;
    selectedImage = imageName;
    returnFocus = trigger || document.activeElement;
    renderDetail(r);
    if (!$('detail-dialog').open) $('detail-dialog').showModal();
    $('close-dialog').focus();
    updateHash();
  }
  function selectQuery(id) {
    const found = data.queries.find(q => q.id === id);
    if (!found) return;
    if ($('detail-dialog').open) $('detail-dialog').close();
    current = found;
    selectedImage = null;
    renderQueries(); renderResults(); updateHash();
    const activeButton = document.querySelector(`[data-query="${current.id}"]`);
    if (activeButton) activeButton.focus({preventScroll:true});
  }
  $('categories').addEventListener('click',event=>{const button=event.target.closest('[data-category]');if(button){category=button.dataset.category;renderQueries();document.querySelector(`[data-category="${category}"]`).focus({preventScroll:true});}});
  $('query-list').addEventListener('click',event=>{const button=event.target.closest('[data-query]');if(button)selectQuery(button.dataset.query);});
  $('query-filter').addEventListener('input',renderQueries);
  $('result-grid').addEventListener('click',event=>{const button=event.target.closest('[data-image]');if(button)openDetail(button.dataset.image,button);});
  $('close-dialog').addEventListener('click',()=>$('detail-dialog').close());
  $('detail-dialog').addEventListener('close',()=>{if($('detail-dialog').open)return;selectedImage=null;updateHash();if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});});
  $('detail-dialog').addEventListener('click',event=>{if(event.target===$('detail-dialog')){const rect=$('detail-dialog').getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)$('detail-dialog').close();}});
  $('language').addEventListener('click',()=>{lang=lang==='en'?'zh':'en';applyLanguage();renderQueries();renderResults();if(selectedImage)renderDetail(current.results.find(r=>r.image_name===selectedImage));updateHash();});
  window.addEventListener('hashchange',()=>{const params=new URLSearchParams(location.hash.slice(1));const query=data.queries.find(q=>q.id===params.get('q'));if(!query)return;current=query;lang=params.get('lang')==='zh'?'zh':'en';const name=params.get('image');if($('detail-dialog').open)$('detail-dialog').close();applyLanguage();renderQueries();renderResults();if(name)openDetail(name);});
  const hero = (data.queries.find(q=>q.id==='coastal-port') || current).results[0];
  if(hero){$('hero-image').src=hero.preview;$('hero-name').textContent=hero.image_name;}
  applyLanguage();renderQueries();renderResults();
  const initialImage = initial.get('image');
  if(initialImage)openDetail(initialImage);else updateHash();
})();
