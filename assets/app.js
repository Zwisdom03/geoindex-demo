/* Two-page navigation over saved GeoIndex results; no live retrieval calls. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const isSearch = document.body.dataset.page === 'search';
  const catalog = window.GEOINDEX_CATALOG || window.GEOINDEX_DATA?.queries || [];
  const params = new URLSearchParams(location.search || location.hash.slice(1));
  let lang = params.get('lang') === 'zh' ? 'zh' : 'en';
  let current = catalog.find(q => q.id === params.get('q')) || null;
  let selectedImage = null;
  let returnFocus = null;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const choose = pair => pair[lang === 'en' ? 0 : 1];
  const titleFor = q => lang === 'en' ? q.en : q.query;
  const score = value => Number(value || 0).toFixed(4);
  const words = {
    eyebrow:['REMOTE-SENSING RETRIEVAL','遥感影像检索'],
    title:['RSITMD Example Queries','RSITMD示例查询'],
    selectLabel:['Retrieval query','检索词条'],placeholder:['Select a query…','请选择检索词条…'],confirm:['View results','确认并查看结果'],
    precomputed:['GeoIndex · RSITMD · Example Results','GeoIndex · RSITMD · 示例结果'],
    footer:['RSITMD benchmark retrieval, with evidence.','RSITMD 基准检索与证据展示'],
    back:['Choose another query','返回选择词条'],resultsLabel:['RETRIEVAL RESULTS','检索结果'],
    resultNote:['Frozen GeoIndex v2 Top-10 results. Scores are ranking signals, not probabilities.','GeoIndex v2 冻结 Top-10 结果。评分用于排序，不代表概率。']
  };
  const categories = {keyword:['Keyword','关键词'],multi_constraint:['Multi-constraint','多约束'],spatial_relation:['Spatial relation','空间关系'],natural_language:['Natural language','自然语言']};
  const scoreNames = {final:['Final ranking','最终排序'],semantic:['Semantic','语义'],semantic_base:['Semantic base','语义基础分'],structure:['Structure','结构'],structure_delta:['Structure evidence','结构证据增量'],relation:['Relation','关系'],relation_delta:['Relation evidence','关系证据增量'],keyword:['Keyword','关键词'],category:['Category','类别'],evidence_layer:['Evidence layer','证据层'],scene:['Scene context','场景上下文'],quantity:['Quantity','数量']};

  function homeUrl() {
    const p = new URLSearchParams({lang});
    if (current) p.set('q',current.id);
    return `index.html?${p}`;
  }
  function rememberSelection() {
    const p = new URLSearchParams({lang});
    if (current) p.set('q',current.id);
    try { history.replaceState(null,'',`${location.pathname}?${p}`); } catch (_) { /* File previews may restrict history. */ }
  }
  function setSelection() {
    current = catalog.find(q => q.id === $('query-select').value) || null;
    $('confirm-query').disabled = !current;
    $('selection-message').textContent = current
      ? choose([`Selected: ${current.en}`,`已选择：${current.query}`])
      : choose(['Choose one of the available examples.','请选择一个可用的检索词条。']);
    rememberSelection();
  }
  function renderSearch() {
    const select = $('query-select');
    select.innerHTML = `<option value="">${choose(words.placeholder)}</option>` + Object.entries(categories).map(([key,label]) => {
      const items = catalog.filter(q => q.category === key);
      return items.length ? `<optgroup label="${esc(choose(label))}">${items.map(q=>`<option value="${esc(q.id)}">${esc(titleFor(q))}</option>`).join('')}</optgroup>` : '';
    }).join('');
    select.value = current?.id || '';
    $('form-language').value = lang;
    $('confirm-query').disabled = !current;
    $('selection-message').textContent = !catalog.length
      ? choose(['The saved examples could not be loaded. Please reload the page.','示例加载失败，请刷新页面。'])
      : current ? choose([`Selected: ${current.en}`,`已选择：${current.query}`])
      : params.has('q') ? choose(['That query is unavailable. Please choose another example.','该词条已不可用，请重新选择。'])
      : choose(['Choose one of the available examples.','请选择一个可用的检索词条。']);
  }
  function renderResults() {
    $('back-link').href = homeUrl();
    $('result-note').hidden = !current;
    $('query-original').hidden = !current || !current.official_query;
    if (!current) {
      $('query-title').textContent = choose(['Choose a query first','请先选择检索词条']);
      $('query-original').textContent = '';
      $('results-status').textContent = '';
      $('result-grid').innerHTML = `<p class="empty-state">${choose(['This query is unavailable. Use the link above to choose an example.','当前词条不可用，请点击上方“返回选择词条”重新选择。'])}</p>`;
      return;
    }
    $('query-title').textContent = titleFor(current);
    $('query-original').textContent = choose([`Official query ${current.source_query_id}: ${current.official_query}`,`官方查询 ${current.source_query_id}：${current.official_query}`]);
    const metrics = current.selection_metrics;
    const performance = metrics ? choose([
      `P@1 ${(metrics.precision_at_1*100).toFixed(0)}% · R@10 ${(metrics.recall_at_10*100).toFixed(0)}% · AP@10 ${(metrics.average_precision_at_10*100).toFixed(1)}%`,
      `P@1 ${(metrics.precision_at_1*100).toFixed(0)}% · R@10 ${(metrics.recall_at_10*100).toFixed(0)}% · AP@10 ${(metrics.average_precision_at_10*100).toFixed(1)}%`
    ]) : '';
    $('results-status').textContent = choose([`${current.results.length} frozen results · ${performance} · Select an image for details`,`${current.results.length} 条冻结结果 · ${performance} · 点击影像查看详情`]);
    $('result-grid').innerHTML = current.results.map(r=>`<article class="result-card"><button type="button" class="image-button" data-image="${esc(r.image_name)}" aria-label="${esc(choose(['View details for ','查看影像详情：'])+r.image_name)}"><img src="${esc(r.thumbnail)}" alt="${esc(r.image_name)}" loading="lazy" width="640" height="640"><span class="rank">#${r.rank}</span></button><div class="card-content"><div class="card-heading"><h2>${esc(r.image_name)}</h2><span class="score" title="${esc(String(r.scores.final))}"><span class="score-label">${choose(['Score','评分'])}</span><span class="score-number">${score(r.scores.final)}</span></span></div><p class="card-description">${esc(r.description)}</p><button type="button" class="detail-button" data-image="${esc(r.image_name)}">${choose(['View details','查看详情'])} →</button></div></article>`).join('');
  }
  function reasonsFor(r) {
    if (lang === 'zh') return r.reasons;
    if (r.reasons_en?.length) return r.reasons_en;
    const reasons = [];
    if (r.matched.keywords.length) reasons.push(`Matched entities or keywords: ${r.matched.keywords.join(', ')}.`);
    if (r.matched.relations.length) reasons.push(`Matched relationships: ${r.matched.relations.join(', ')}.`);
    if (r.scores.relation > 0) reasons.push('Relationship evidence contributed to this candidate’s ranking.');
    if (r.scores.evidence_layer > 0) reasons.push('Supporting evidence contributed to the ranking.');
    if (r.scores.scene >= .5) reasons.push('The scene-context score is at least 0.5.');
    if (!reasons.length) reasons.push('This candidate is primarily supported by semantic retrieval; structured evidence is limited.');
    return reasons;
  }
  function renderDetail(r) {
    $('detail-title').textContent = `#${r.rank} / ${r.image_name}`;
    const s = r.strict_match || {};
    let diagnostic = s.passed ? choose(['Passed the rule-based strict-match check.','通过基于规则的严格匹配检查。']) : choose(['Did not pass all rule-based strict-match conditions.','未通过全部基于规则的严格匹配条件。']);
    if (!s.passed) {
      const missing = [...(s.missing_entities || []).map(x=>`${x.field}=${x.value}`),...(s.missing_relations || []).map(x=>[x.subject,x.relation,x.object].filter(Boolean).join(' ')),...(s.score_reasons || [])];
      if (missing.length) diagnostic += ' '+choose(['Unmet conditions: ','未满足条件：'])+missing.join('; ');
    }
    const scoreRows = Object.keys(scoreNames).filter(k=>k in r.scores).map(k=>`<div class="score-row"><span>${choose(scoreNames[k])}</span><span class="score-value" title="${esc(String(r.scores[k]))}">${score(r.scores[k])}</span></div>`).join('');
    const evidence = r.evidence.length ? r.evidence.map(e=>`<blockquote><span class="evidence-type">${esc([e.doc_type,e.relation].filter(Boolean).join(' / '))}</span>${esc(e.evidence)}</blockquote>`).join('') : `<p>${choose(['No textual evidence was saved for this candidate.','该候选没有保存文字支撑证据。'])}</p>`;
    $('detail-content').innerHTML = `<div class="detail-layout"><div class="detail-visual"><img src="${esc(r.preview)}" alt="${esc(r.image_name)}"><p class="image-meta">${r.width} × ${r.height} ${choose(['source pixels · resized preview','原始像素 · 缩放预览'])}</p><section class="detail-section"><h3>${choose(['Source description','原始描述'])}</h3><p>${esc(r.description)}</p></section></div><div class="detail-analysis"><p class="detail-score"><span>${choose(['Ranking score','排序评分'])}</span>${score(r.scores.final)}</p><section class="detail-section"><h3>${choose(['Why this result?','检索依据'])}</h3><ul class="reason-list">${reasonsFor(r).map(reason=>`<li>${esc(reason)}</li>`).join('')}</ul></section><section class="detail-section"><h3>${choose(['Supporting evidence','支撑证据'])}</h3>${evidence}</section><details class="detail-extra"><summary>${choose(['Score breakdown','评分分项'])}</summary>${scoreRows}<p>${choose(['These ranking signals are not probabilities. The final score is not a simple unweighted sum.','这些分数是排序信号，并非概率。最终得分不是各分项的简单相加。'])}</p></details><details class="detail-extra"><summary>${choose(['Match diagnostic','匹配检查'])}</summary><p class="diagnostic">${esc(diagnostic)}</p><p>${choose(['This diagnostic uses rules, not human relevance judgments. Explanations summarize the saved metadata and evidence.','检查结果来自规则，不代表人工相关性判断。解释基于已保存的元数据与证据。'])}</p></details></div></div>`;
  }
  function openDetail(imageName, trigger) {
    const result = current?.results.find(r=>r.image_name === imageName);
    if (!result) return;
    selectedImage = imageName;
    returnFocus = trigger || document.activeElement;
    renderDetail(result);
    if (!$('detail-dialog').open) $('detail-dialog').showModal();
    $('close-dialog').focus();
  }
  function render() {
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    document.title = `GeoIndex · ${isSearch ? choose(['Select a query','选择词条']) : current ? titleFor(current) : choose(['Results','检索结果'])}`;
    document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=choose(words[el.dataset.i18n]);});
    $('language').textContent = lang === 'en' ? '中文' : 'EN';
    $('language').setAttribute('aria-label',choose(['切换为中文','Switch to English']));
    document.querySelector('.brand').href = homeUrl();
    if (isSearch) renderSearch();
    else {
      $('close-dialog').setAttribute('aria-label',choose(['Close details','关闭详情']));
      renderResults();
      if (selectedImage) renderDetail(current.results.find(r=>r.image_name === selectedImage));
    }
  }
  $('language').addEventListener('click',()=>{lang=lang === 'en' ? 'zh' : 'en';render();rememberSelection();});
  if (isSearch) {
    $('query-select').addEventListener('change',setSelection);
    window.addEventListener('pageshow',()=>{
      current = catalog.find(q=>q.id === $('query-select').value) || null;
      $('confirm-query').disabled = !current;
    });
  } else {
    $('result-grid').addEventListener('click',event=>{const button=event.target.closest('[data-image]');if(button)openDetail(button.dataset.image,button);});
    $('close-dialog').addEventListener('click',()=>$('detail-dialog').close());
    $('detail-dialog').addEventListener('close',()=>{selectedImage=null;if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});});
    $('detail-dialog').addEventListener('click',event=>{if(event.target === $('detail-dialog')){const rect=$('detail-dialog').getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)$('detail-dialog').close();}});
  }
  render();
})();
