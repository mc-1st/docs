(() => {
  if (window.__mc1stRulesChatbot) return;
  window.__mc1stRulesChatbot = true;
  const endpoint = 'https://ai.mc-1st.ro/chat';
  const style = document.createElement('style');
  style.textContent = `
    #mc1st-rules-chat-button{position:fixed;right:22px;bottom:22px;z-index:99999;border:0;border-radius:999px;background:#346ddb;color:#fff;padding:13px 18px;font:600 14px system-ui,sans-serif;box-shadow:0 8px 25px #0008;cursor:pointer}
    #mc1st-rules-chat{position:fixed;right:22px;bottom:78px;z-index:99999;width:min(390px,calc(100vw - 28px));background:#111827;color:#f9fafb;border:1px solid #ffffff24;border-radius:16px;box-shadow:0 18px 55px #000a;overflow:hidden;font:14px system-ui,sans-serif;display:none}
    #mc1st-rules-chat.open{display:block} #mc1st-rules-chat header{padding:15px 16px;background:#172554;font-weight:700;display:flex;justify-content:space-between;align-items:center} #mc1st-rules-chat header button{border:0;background:transparent;color:#fff;font-size:22px;cursor:pointer}
    #mc1st-rules-messages{height:300px;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:10px}.mc1st-msg{padding:10px 12px;border-radius:12px;line-height:1.45;white-space:pre-wrap}.mc1st-user{background:#346ddb;align-self:flex-end}.mc1st-bot{background:#1f2937;align-self:stretch}.mc1st-sources{font-size:12px;margin-top:8px}.mc1st-sources a{color:#93c5fd}
    #mc1st-rules-form{display:flex;gap:8px;padding:12px;border-top:1px solid #ffffff1f}#mc1st-rules-input{min-width:0;flex:1;border:1px solid #ffffff33;border-radius:9px;background:#0b1220;color:#fff;padding:10px;font:inherit}#mc1st-rules-form button{border:0;border-radius:9px;background:#346ddb;color:#fff;padding:0 13px;font:600 13px system-ui;cursor:pointer}
  `;
  document.head.append(style);
  const button = document.createElement('button');
  button.id = 'mc1st-rules-chat-button'; button.textContent = 'Întreabă regulamentul';
  const panel = document.createElement('section'); panel.id = 'mc1st-rules-chat'; panel.setAttribute('aria-label', 'Întreabă regulamentul');
  panel.innerHTML = `<header>Întreabă regulamentul <button type="button" aria-label="Închide">×</button></header><div id="mc1st-rules-messages"><div class="mc1st-msg mc1st-bot">Întreabă despre reguli și sancțiuni. Răspunsurile includ sursele din regulament.</div></div><form id="mc1st-rules-form"><input id="mc1st-rules-input" maxlength="1000" placeholder="Ex.: Ce se întâmplă dacă insult pe chat?" required><button>Trimite</button></form>`;
  document.body.append(button, panel);
  const messages = panel.querySelector('#mc1st-rules-messages'); const input = panel.querySelector('input'); const form = panel.querySelector('form');
  const message = (text, kind, sources = []) => { const item = document.createElement('div'); item.className = `mc1st-msg ${kind}`; item.textContent = text; if (sources.length) { const links = document.createElement('div'); links.className = 'mc1st-sources'; links.append('Sursă: '); sources.forEach((source, index) => { const link = document.createElement('a'); link.href = source.url; link.textContent = source.title; link.target = '_blank'; link.rel = 'noopener'; links.append(link); if (index < sources.length - 1) links.append(', '); }); item.append(links); } messages.append(item); messages.scrollTop = messages.scrollHeight; return item; };
  button.onclick = () => { panel.classList.toggle('open'); if (panel.classList.contains('open')) input.focus(); };
  panel.querySelector('header button').onclick = () => panel.classList.remove('open');
  form.onsubmit = async (event) => { event.preventDefault(); const question = input.value.trim(); if (!question) return; message(question, 'mc1st-user'); input.value = ''; const pending = message('Caut în regulament…', 'mc1st-bot'); try { const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question }) }); const result = await response.json(); pending.remove(); if (!response.ok) throw new Error(result.error || 'A apărut o eroare.'); message(`${result.answer}\n\nSancțiune: ${result.sanction}`, 'mc1st-bot', result.sources || []); } catch (error) { pending.remove(); message(error.message || 'A apărut o eroare. Încearcă din nou.', 'mc1st-bot'); } };
})();
