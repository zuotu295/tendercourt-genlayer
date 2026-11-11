import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CATEGORIES, FEE_WEI, DEPLOYMENT, loadDeployment, contractAddress, explorerTx, explorerAddress,
  readAllTenders, readTotals,
  savePendingTx, loadPendingTxs, clearPendingTx, TxUnknownError, waitFinalized,
  leaderExecution, leaderPayload, txGood,
  walletKind, connectInjected,
  tempPrivateKey, isTempKeyAcked, ackTempKey, temporaryAccount, rotateTemporaryAccount, destroyTemporaryAccount,
  sendWriteOnly, shortAddr, gen, fmtReadbackTime,
  type Wallet, type TenderRec, type Totals,
} from './chain';
import { validateRequirements, validateCategory, validateBudget, validatePrice, validateTerms, countOf } from './validate';
import { t, type Lang } from './i18n';

interface TxState { label: string; hash: string; stage: 'sent' | 'ok' | 'unknown' | 'failed'; detail?: string }

export default function App() {
  const [lang, setLang] = useState<Lang>('zh');
  const [dep, setDep] = useState<typeof DEPLOYMENT>(null);
  const [tenders, setTenders] = useState<TenderRec[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [readback, setReadback] = useState<{ ok: boolean; at: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [walletErr, setWalletErr] = useState('');
  const [tx, setTx] = useState<TxState | null>(null);
  const [busy, setBusy] = useState(false);

  // key modal
  const [keyModal, setKeyModal] = useState(false);
  const [keyAcked, setKeyAcked] = useState(false);
  const [showFullKey, setShowFullKey] = useState(false);
  const [keyDismissed, setKeyDismissed] = useState(false);

  // create form
  const [req, setReq] = useState('');
  const [cat, setCat] = useState(CATEGORIES[0]);
  const [budget, setBudget] = useState('');
  // quote form (per selected tender)
  const [quoteTender, setQuoteTender] = useState<number | null>(null);
  const [price, setPrice] = useState('');
  const [terms, setTerms] = useState('');

  const me = wallet?.address?.toLowerCase() || '';
  const isTemp = wallet?.mode === 'temporary';
  const tr = (k: string) => t(k, lang);

  const refresh = useCallback(async () => {
    const { tenders: list, is_finalized_readback, at } = await readAllTenders();
    setTenders(list);
    setReadback({ ok: is_finalized_readback, at });
    setTotals(await readTotals());
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await loadDeployment();
        setDep(DEPLOYMENT);
        await refresh();
        // Resume any tx that was sent but not yet FINALIZED (incl. after refresh).
        for (const p of loadPendingTxs()) {
          setTx({ label: p.label, hash: p.hash, stage: 'sent' });
          try {
            const receipt = await waitFinalized(p.hash);
            clearPendingTx(p.hash);
            setTx({ label: p.label, hash: p.hash, stage: txGood(receipt) ? 'ok' : 'failed', detail: txGood(receipt) ? undefined : 'leader=' + String(leaderExecution(receipt)) });
            await refresh();
          } catch {
            setTx({ label: p.label, hash: p.hash, stage: 'unknown' });
          }
        }
      } catch (e: any) {
        setLoadErr(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  const keyExposure = useMemo(() => {
    if (!wallet || !isTemp) return null;
    const mine = tenders.filter((x) => x.buyer === me || x.winner_supplier === me);
    const unsettled = mine.filter((x) => x.status === 'OPEN' || x.status === 'JUDGING').length;
    const withdrawable = mine.reduce((s, x) => s + (x.winner_supplier === me && x.winner_credit > 0 && !x.winner_withdrawn ? x.winner_credit : 0) + (x.buyer === me && x.buyer_credit > 0 && !x.buyer_withdrawn ? x.buyer_credit : 0), 0);
    return { n: unsettled, x: gen(withdrawable) };
  }, [wallet, isTemp, tenders, me]);

  // ---- write path: ack gate -> double confirm -> send -> save hash -> wait ----
  async function ensureKeyAcked(): Promise<boolean> {
    if (!isTemp) return true;
    if (isTempKeyAcked()) return true;
    if (keyDismissed) {
      // Dismissed earlier: re-show the modal on the first write.
      setKeyModal(true);
      return false;
    }
    setKeyModal(true);
    return false;
  }

  async function doWrite(label: string, fn: string, args: any[], value: bigint, confirmText: string): Promise<boolean> {
    if (!wallet) { setWalletErr(tr('notConnected')); return false; }
    if (busy) return false;
    if (!(await ensureKeyAcked())) return false;
    if (!window.confirm(confirmText + '\n\n' + tr('confirmSend'))) return false;
    setBusy(true);
    setTx({ label, hash: '', stage: 'sent' });
    try {
      const hash = await sendWriteOnly(wallet, fn, args, value);
      savePendingTx(hash, label);
      setTx({ label, hash, stage: 'sent' });
      const receipt = await waitFinalized(hash);
      clearPendingTx(hash);
      if (!txGood(receipt)) {
        setTx({ label, hash, stage: 'failed', detail: 'leader=' + String(leaderExecution(receipt)) + ' ' + leaderPayload(receipt) });
        return false;
      }
      setTx({ label, hash, stage: 'ok' });
      await refresh();
      return true;
    } catch (e: any) {
      if (e instanceof TxUnknownError) {
        setTx({ label, hash: e.hash, stage: 'unknown' });
        return false;
      }
      setTx({ label, hash: tx?.hash || '', stage: 'failed', detail: e?.shortMessage || e?.message || String(e) });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function connect(kind: 'injected' | 'temporary') {
    setWalletErr('');
    try {
      const w = kind === 'injected' ? await connectInjected() : await temporaryAccount();
      setWallet(w);
      if (kind === 'temporary' && !isTempKeyAcked()) setKeyModal(true);
    } catch (e: any) {
      setWalletErr(e?.shortMessage || e?.message || String(e));
    }
  }

  function disconnect() {
    if (wallet?.mode === 'temporary') {
      const mine = tenders.filter((x) => (x.buyer === me || x.winner_supplier === me) && (x.status === 'OPEN' || x.status === 'JUDGING'));
      if (mine.length > 0 && !window.confirm(tr('keyExposure').replace('{n}', String(mine.length)).replace('{x}', '…'))) return;
      destroyTemporaryAccount();
    }
    setWallet(null);
  }

  async function rotateTemp() {
    if (!window.confirm(tr('rotate'))) return;
    const w = await rotateTemporaryAccount();
    setWallet(w);
    setKeyDismissed(false);
    setKeyModal(true);
  }

  // ---- create tender ----
  const reqErr = req === '' ? null : validateRequirements(req);
  const catErr = validateCategory(cat);
  const budgetErr = budget === '' ? null : validateBudget(budget);
  const createValid = req !== '' && !reqErr && !catErr && budget !== '' && !budgetErr;
  async function createTender() {
    if (!createValid || !wallet) return;
    if (isTemp) return; // escrow funding needs a persistent wallet
    const ok = await doWrite('create_tender', 'create_tender', [req.trim(), cat, Number(budget)], FEE_WEI,
      `${tr('createTitle')}\n${tr('reqLabel')}: ${req.trim().slice(0, 80)}…\n${tr('budgetLabel')}: ${budget} GEN\n${tr('feeNote')}`);
    if (ok) { setReq(''); setBudget(''); }
  }

  // ---- quote ----
  const selTender = tenders.find((x) => x.tender_id === quoteTender) || null;
  const priceErr = price === '' || !selTender ? null : validatePrice(price, selTender.budget_gen);
  const termsErr = terms === '' ? null : validateTerms(terms);
  const quoteValid = !!selTender && price !== '' && !priceErr && terms !== '' && !termsErr;
  async function submitQuote() {
    if (!quoteValid || !selTender || !wallet) return;
    const ok = await doWrite('submit_quote', 'submit_quote', [selTender.tender_id, Number(price), terms.trim()], 0n,
      `${tr('submitQuote')} · Tender #${selTender.tender_id}\n${tr('priceLabel')}: ${price} GEN\n${tr('termsLabel')}: ${terms.trim().slice(0, 80)}…`);
    if (ok) { setPrice(''); setTerms(''); setQuoteTender(null); }
  }

  async function award(t: TenderRec, quoteId: number) {
    await doWrite('award_tender', 'award_tender', [t.tender_id, quoteId], 0n,
      `${tr('award')} · Tender #${t.tender_id} · Quote #${quoteId}`);
  }
  async function requestJudgment(t: TenderRec) {
    await doWrite('request_judgment', 'request_judgment', [t.tender_id], 0n,
      `${tr('requestJudgment')} · Tender #${t.tender_id}`);
  }
  async function judge(t: TenderRec) {
    await doWrite('judge', 'judge', [t.tender_id], 0n,
      `${tr('judge')} · Tender #${t.tender_id}`);
  }
  async function cancel(t: TenderRec) {
    await doWrite('cancel_tender', 'cancel_tender', [t.tender_id], 0n,
      `${tr('cancelQuote')} · Tender #${t.tender_id}\n${tr('feeNote')}`);
  }
  async function withdraw(t: TenderRec) {
    await doWrite('withdraw', 'withdraw', [t.tender_id], 0n,
      `${tr('withdraw')} · Tender #${t.tender_id} · 10 GEN`);
  }

  function exportDossier(t: TenderRec) {
    if (!readback?.ok) return;
    const blob = new Blob([JSON.stringify({ tender: t, totals, contract: contractAddress(), readback_at: readback.at, network: 'Stable Studionet (61999)' }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tendercourt-tender-${t.tender_id}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const tempKey = tempPrivateKey();
  const maskedKey = tempKey ? tempKey.slice(0, 6) + '…' + tempKey.slice(-4) : '';

  return (
    <div className="wrap">
      <header className="site">
        <div className="brand">
          <h1>TenderCourt 比选庭</h1>
          <span className="tag">GenLayer · Stable Studionet 61999</span>
          <button className="btn ghost" onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}>{lang === 'zh' ? 'EN' : '中文'}</button>
        </div>
        <div className="rule-brass" />
        <div className="hero">
          <h2>{tr('heroTitle')}</h2>
          <p>{tr('heroSub')}</p>
          <div className="steps">
            <div><b>01</b><span>{tr('step1')}</span></div>
            <div><b>02</b><span>{tr('step2')}</span></div>
            <div><b>03</b><span>{tr('step3')}</span></div>
            <div><b>04</b><span>{tr('step4')}</span></div>
          </div>
        </div>
        <div className="walletbar">
          {wallet ? (
            <>
              <span className="who">{tr('connectedAs')} {shortAddr(wallet.address)} · {wallet.mode === 'temporary' ? '⚠ ' + tr('useTemp') : walletKind()}</span>
              <button className="btn ghost" onClick={disconnect}>{tr('disconnect')}</button>
              {isTemp && <button className="btn ghost" onClick={rotateTemp}>{tr('rotate')}</button>}
              {isTemp && <button className="btn ghost" onClick={() => setKeyModal(true)}>{tr('exportKey')}</button>}
            </>
          ) : (
            <>
              <button className="btn" onClick={() => connect('injected')}>{tr('connect')} · OKX / MetaMask</button>
              <button className="btn ghost" onClick={() => connect('temporary')}>{tr('useTemp')}</button>
              <span className="small">{tr('notConnected')}</span>
            </>
          )}
        </div>
        {walletErr && <p className="hint light" style={{ color: '#ffb4ab' }}>{walletErr}</p>}
        {isTemp && (
          <div className="banner">{tr('tempNote')}</div>
        )}
      </header>

      {tx && tx.hash && (
        <div className={`txbox ${tx.stage === 'ok' ? 'ok' : tx.stage === 'failed' ? 'bad' : ''}`}>
          <b>{tr('txProgress')} — {tx.label}</b>
          <div className="mono">
            {tx.stage === 'sent' && tr('sent')}<br />
            {tx.stage === 'ok' && tr('finalizedOk')}<br />
            {tx.stage === 'unknown' && tr('txUnknown')}<br />
            {tx.stage === 'failed' && tr('txFailed')}{tx.detail ? ' — ' + tx.detail : ''}
          </div>
          <div className="mono"><a href={explorerTx(tx.hash)} target="_blank" rel="noreferrer">{tr('viewExplorer')} · {tx.hash.slice(0, 18)}…</a></div>
        </div>
      )}

      <section className="panel">
        <h2><span className="no">§01</span>{tr('createTitle')}</h2>
        <p className="sub">{tr('feeNote')}</p>
        <label>{tr('reqLabel')}</label>
        <textarea value={req} maxLength={2000} onChange={(e) => setReq(e.target.value)} placeholder={tr('reqPh')} />
        <div className={`count ${reqErr === 'req_long' ? 'over' : ''}`}>{countOf(req)} / 2000</div>
        {reqErr && <p className="err">{tr('err_' + reqErr)}</p>}
        <div className="row">
          <div>
            <label>{tr('catLabel')}</label>
            <select value={cat} onChange={(e) => setCat(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label>{tr('budgetLabel')}</label>
            <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder={tr('budgetPh')} />
            {budgetErr && <p className="err">{tr('err_' + budgetErr)}</p>}
          </div>
        </div>
        {isTemp && <p className="hint">{tr('tempBlockedCreate')}</p>}
        <div className="btnrow">
          <button className="btn primary" disabled={!createValid || !wallet || isTemp || busy} onClick={createTender}>{tr('createBtn')}</button>
          {!wallet && <span className="hint">{tr('notConnected')}</span>}
        </div>
      </section>

      <section className="panel">
        <h2><span className="no">§02</span>{tr('board')}</h2>
        <p className="sub">
          {readback?.ok ? <>{tr('finalizedAt')} {fmtReadbackTime(readback.at)}<br /><span className="hint">{tr('readbackNote')}</span></> : tr('unconfirmed')}
        </p>
        <div className="btnrow" style={{ marginTop: 0 }}>
          <button className="btn ghost dark" onClick={refresh} disabled={loading}>{tr('refresh')}</button>
        </div>
        {loading && <p>{tr('sent')}</p>}
        {loadErr && <p className="err">{loadErr}</p>}
        {!loading && tenders.length === 0 && <p>{tr('noTenders')}</p>}
        {[...tenders].reverse().map((t) => {
          const isBuyer = me && t.buyer === me;
          const myQuote = t.quotes.find((q) => q.supplier === me);
          const canQuote = me && t.status === 'OPEN' && !isBuyer && !myQuote;
          const canAward = isBuyer && (t.status === 'OPEN' || t.status === 'JUDGING') && t.quotes.length > 0;
          const canRequest = isBuyer && t.status === 'OPEN' && t.quotes.length > 0;
          const canJudge = isBuyer && t.status === 'JUDGING';
          const canCancel = isBuyer && t.status === 'OPEN' && t.quotes.length === 0;
          const canWithdrawW = me && t.winner_supplier === me && t.winner_credit > 0 && !t.winner_withdrawn;
          const canWithdrawB = me && t.buyer === me && t.buyer_credit > 0 && !t.buyer_withdrawn;
          const winnerQuote = t.winner_quote_id ? t.quotes.find((q) => q.quote_id === t.winner_quote_id) : null;
          return (
            <article className="tender" key={t.tender_id}>
              <div className="thead">
                <h3><span className="id">#{t.tender_id}</span> {t.category} · {t.budget_gen} GEN {t.status === 'AWARDED' && <span className="stamp">AWARDED</span>}{t.status === 'CANCELLED' && t.winner_quote_id === 0 && t.reason && <span className="stamp noaward">NO AWARD</span>}</h3>
                <span className={`status ${t.status}`}>{t.status}</span>
              </div>
              <p className="req">{t.requirements}</p>
              <p className="meta">
                {tr('buyer')}: {shortAddr(t.buyer)} · {tr('quotes')}: {t.quotes.length} · {tr('escrowed')}: {t.status === 'OPEN' || t.status === 'JUDGING' ? '10 GEN' : '0 GEN'}
                {t.reason && <><br />{tr('reason')}: {t.reason}</>}
                {winnerQuote && <><br />{tr('winner')}: #{winnerQuote.quote_id} · {winnerQuote.price_gen} GEN · {shortAddr(winnerQuote.supplier)}</>}
              </p>
              {t.status === 'JUDGING' && <p className="hint">{tr('judgingNote')}</p>}
              {t.quotes.map((q) => (
                <div className={`quote ${t.winner_quote_id === q.quote_id ? 'winner' : ''}`} key={q.quote_id}>
                  <div className="qhead">
                    <b>{tr('quoteN')} #{q.quote_id}</b>
                    <span className="price">{q.price_gen} GEN</span>
                  </div>
                  <p className="terms">{q.terms}</p>
                  <p className="who">{tr('supplier')}: {shortAddr(q.supplier)}{t.winner_quote_id === q.quote_id ? ' · ★ ' + tr('winner') : ''}</p>
                  {canAward && (
                    <div className="qactions">
                      <button className="btn" disabled={busy} onClick={() => award(t, q.quote_id)}>{tr('award')}</button>
                    </div>
                  )}
                </div>
              ))}
              <div className="btnrow">
                {canQuote && <button className="btn" disabled={busy} onClick={() => { setQuoteTender(t.tender_id); setPrice(''); setTerms(''); }}>{tr('quoteTitle')}</button>}
                {canRequest && <button className="btn" disabled={busy} onClick={() => requestJudgment(t)}>{tr('requestJudgment')}</button>}
                {canJudge && <button className="btn primary" disabled={busy} onClick={() => judge(t)}>{tr('judge')}</button>}
                {canCancel && <button className="btn danger" disabled={busy} onClick={() => cancel(t)}>{tr('cancel')}</button>}
                {canWithdrawW && <button className="btn primary" disabled={busy} onClick={() => withdraw(t)}>{tr('withdrawW')} · 10 GEN</button>}
                {canWithdrawB && <button className="btn primary" disabled={busy} onClick={() => withdraw(t)}>{tr('withdrawB')} · 10 GEN</button>}
                <button className="btn ghost dark" disabled={!readback?.ok} title={readback?.ok ? '' : tr('exportGated')} onClick={() => exportDossier(t)}>{tr('export')}</button>
              </div>
              {!readback?.ok && <p className="hint">{tr('exportGated')}</p>}
              {quoteTender === t.tender_id && (
                <div style={{ marginTop: 12 }}>
                  <label>{tr('priceLabel')} · {tr('budgetLabel')}: {t.budget_gen} GEN</label>
                  <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={tr('budgetPh')} />
                  {priceErr && <p className="err">{tr('err_' + priceErr)}</p>}
                  <label>{tr('termsLabel')}</label>
                  <textarea value={terms} maxLength={2000} onChange={(e) => setTerms(e.target.value)} placeholder={tr('termsPh')} />
                  <div className={`count ${termsErr === 'terms_long' ? 'over' : ''}`}>{countOf(terms)} / 2000</div>
                  {termsErr && <p className="err">{tr('err_' + termsErr)}</p>}
                  <div className="btnrow">
                    <button className="btn primary" disabled={!quoteValid || busy} onClick={submitQuote}>{tr('submitQuote')}</button>
                    <button className="btn ghost dark" onClick={() => setQuoteTender(null)}>✕</button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
        {totals && (
          <div className="kv">
            <div><b>{tr('received')}</b><span>{gen(totals.total_received_wei)} GEN</span></div>
            <div><b>{tr('withdrawn')}</b><span>{gen(totals.total_withdrawn_wei)} GEN</span></div>
            <div><b>{tr('balance')}</b><span>{gen(totals.contract_balance_wei)} GEN</span></div>
            <div><b>{tr('escrowed')}</b><span>{gen(totals.escrowed_wei)} GEN</span></div>
          </div>
        )}
      </section>

      <section className="evidence-panel">
        <h2>{tr('evidence')}</h2>
        <p>{tr('evidenceText')}</p>
        <p className="mono small">
          Contract · {dep ? dep.contract_address : '—'}{' '}
          {dep && <a href={explorerAddress(dep.contract_address)} target="_blank" rel="noreferrer">explorer-studio.genlayer.com</a>}
        </p>
        <p className="mono small">{tr('awardExpl')}</p>
      </section>

      <footer className="site">
        <p><b>TenderCourt 比选庭</b> · GenLayer Stable Studionet (Chain ID 61999) · Intelligent Contract · tendercourt-1</p>
        <p className="mono">Contract: {dep ? dep.contract_address : 'awaiting deployment.json — UNCONFIRMED'}{dep && <> · <a href={explorerAddress(dep.contract_address)} target="_blank" rel="noreferrer">explorer-studio.genlayer.com</a></>}</p>
        <p className="mono small">Source SHA-256: {dep ? dep.source_sha256 : '—'} · Fee: 10 GEN fixed · {tr('awardExpl')}</p>
      </footer>

      {keyModal && wallet && isTemp && (
        <div className="backdrop" onClick={(e) => { if (e.target === e.currentTarget) { setKeyModal(false); setKeyDismissed(true); } }}>
          <div className="key-modal-card" role="dialog" aria-modal="true">
            <h3>{tr('keyModalTitle')}</h3>
            <p>{tr('keyModalBody')}</p>
            <div className="keybox">{showFullKey ? (tempKey || '') : maskedKey}</div>
            <p className="hint">{keyExposure ? (keyExposure.n === 0 && keyExposure.x === '0' ? tr('keyExposureNone') : tr('keyExposure').replace('{n}', String(keyExposure.n)).replace('{x}', keyExposure.x)) : ''}</p>
            <p className="hint">{tr('keyMaskNote')}</p>
            <div className="btnrow">
              <button className="btn" onClick={() => setShowFullKey(!showFullKey)}>{showFullKey ? tr('keyHideFull') : tr('keyShowFull')}</button>
              <button className="btn" onClick={() => { if (tempKey) navigator.clipboard?.writeText(tempKey); }}>{tr('keyCopy')}</button>
              <button className="btn" onClick={() => {
                if (!tempKey) return;
                const blob = new Blob([tempKey], { type: 'text/plain' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob); a.download = 'tendercourt-temp-key.txt'; a.click(); URL.revokeObjectURL(a.href);
              }}>{tr('keyExport')}</button>
            </div>
            <div className="ackrow">
              <input id="key-ack" type="checkbox" checked={keyAcked} onChange={(e) => setKeyAcked(e.target.checked)} />
              <label htmlFor="key-ack">{tr('keyAck')}</label>
            </div>
            <div className="btnrow">
              <button className="btn primary" disabled={!keyAcked} onClick={() => { ackTempKey(); setKeyModal(false); setKeyAcked(false); }}>{tr('keySaved')}</button>
              <button className="btn ghost dark" onClick={() => { setKeyModal(false); setKeyDismissed(true); }}>{tr('keyLater')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
