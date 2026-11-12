import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { Gift, LockKeyhole, LogOut, X, ExternalLink, Check, Pencil, Trash2 } from 'lucide-react';

const emptyForm = {
    name: '', brand: '', store: '', price: '', size: '', color: '',
    description: '', purchase_url: '', image_url: '', category: ''
};

function Snowfall() {
    useEffect(() => {
        const canvas = document.querySelector('.snowfall-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduced) return;
        let width = 0, height = 0, frame = 0, flakes = [];
        const resize = () => {
            const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
            width = window.innerWidth; height = window.innerHeight;
            canvas.width = Math.floor(width * ratio);
            canvas.height = Math.floor(height * ratio);
            canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
            const count = Math.min(width < 700 ? 45 : 110, Math.max(24, Math.round(width / 12)));
            flakes = Array.from({ length: count }, () => ({
                x: Math.random() * width, y: Math.random() * height,
                r: 1.5 + Math.random() * 2.6, speed: .25 + Math.random() * .65,
                drift: .15 + Math.random() * .35, phase: Math.random() * Math.PI * 2,
                alpha: .7 + Math.random() * .3
            }));
        };
        const draw = () => {
            ctx.clearRect(0, 0, width, height);
            // white flakes vanish on the cream page without a cool halo
            ctx.shadowColor = 'rgba(70, 95, 130, .55)'; ctx.shadowBlur = 5;
            flakes.forEach(f => {
                f.phase += .008;
                f.y += f.speed;
                f.x += Math.sin(f.phase) * f.drift;
                if (f.y > height + 5) { f.y = -5; f.x = Math.random() * width; }
                if (f.x < -5) f.x = width + 5;
                if (f.x > width + 5) f.x = -5;
                ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${f.alpha})`; ctx.fill();
            });
            frame = requestAnimationFrame(draw);
        };
        resize(); draw();
        window.addEventListener('resize', resize);
        return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); };
    }, []);
    return <canvas className="snowfall-canvas" aria-hidden="true" />;
}

// looping clips of the two dogs; a still poster for people who ask for less motion
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function ChristmasDog({ kind }) {
    return (
        <span className={`christmas-dog christmas-dog-${kind}`} aria-hidden="true">
            <video src={`${BASE}dog-${kind}.mp4`} poster={`${BASE}dog-${kind}-poster.webp`}
                width="360" height="360" autoPlay={!reducedMotion} loop muted playsInline disablePictureInPicture />
        </span>
    );
}

const formatPrice = price => Number(price).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
const BASE = import.meta.env.BASE_URL;

// reservation tokens live in this browser only: they prove "I reserved this" without any login
const CLAIMS_KEY = 'wishlist-claims';
const readClaims = () => { try { return JSON.parse(localStorage.getItem(CLAIMS_KEY)) || {}; } catch { return {}; } };
// invite code arrives once in the link (#convite-<code>) and stays in this browser; without it the list shows no states
const INVITE_KEY = 'wishlist-invite';
const INVITE = (() => {
    const fromLink = location.hash.match(/^#convite-(\w+)/)?.[1];
    try {
        if (fromLink) localStorage.setItem(INVITE_KEY, fromLink);
        return fromLink || localStorage.getItem(INVITE_KEY);
    } catch { return fromLink || null; }
})();
// explicit list: the state columns are not readable from the table, only through gift_states
const COLUMNS = 'id,name,image_url,brand,store,price,size,color,description,purchase_url,category,created_at';
const stateOf = p => p.purchased_at ? 'purchased' : p.claimed_at ? 'reserved' : 'available';
const STATE_LABEL = { available: 'Disponível', reserved: 'Reservado', purchased: 'Comprado' };
const STATE_ORDER = { available: 0, reserved: 1, purchased: 2 };

export default function App() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState(null); // { text }
    const [adminOpen, setAdminOpen] = useState(false);
    const [session, setSession] = useState(null);
    const [admin, setAdmin] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [reservingId, setReservingId] = useState(null);
    const [claims, setClaims] = useState(readClaims);
    const [confirmingId, setConfirmingId] = useState(null);
    const [category, setCategory] = useState('Todos');
    const [guest, setGuest] = useState(false); // invite code accepted by the server
    const adminRef = useRef(null);
    // the list owner never sees states, even on a device that has the invite
    const showStates = guest && !admin;

    const categories = useMemo(() => {
        const counts = new Map([['Todos', products.length]]);
        products.forEach(p => p.category && counts.set(p.category, (counts.get(p.category) || 0) + 1));
        return [...counts];
    }, [products]);
    // available gifts first, then reserved, purchased last
    const visibleProducts = useMemo(
        () => (category === 'Todos' ? products : products.filter(p => p.category === category))
            .slice().sort((a, b) => showStates ? STATE_ORDER[stateOf(a)] - STATE_ORDER[stateOf(b)] : 0),
        [products, category, showStates]
    );

    async function loadProducts() {
        if (!supabase) { setLoading(false); return; }
        setLoading(true);
        const [list, states] = await Promise.all([
            supabase.from('products').select(COLUMNS).order('created_at', { ascending: false }),
            INVITE ? supabase.rpc('gift_states', { p_code: INVITE }) : { data: null }
        ]);
        if (list.error) setError(`Não foi possível carregar a lista. Recarrega a página. (${list.error.message})`);
        else {
            const byId = new Map((states.data || []).map(s => [s.id, s]));
            setProducts(list.data.map(p => ({ ...p, ...byId.get(p.id) })));
            setGuest(Boolean(states.data));
        }
        setLoading(false);
    }

    async function checkAdmin(currentSession) {
        if (!currentSession || !supabase) { setAdmin(false); return; }
        const { data, error } = await supabase.rpc('is_admin');
        setAdmin(!error && data === true);
    }

    useEffect(() => {
        if (!supabase) { setLoading(false); return; }
        loadProducts();
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
            checkAdmin(data.session);
        });
        const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
            setSession(nextSession);
            checkAdmin(nextSession);
        });
        return () => listener.subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!notice) return;
        const t = setTimeout(() => setNotice(null), 7000);
        return () => clearTimeout(t);
    }, [notice]);

    useEffect(() => {
        if (adminOpen) adminRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [adminOpen]);

    // reveal-once entrances; content stays visible without JS (hidden state only under html.js)
    useEffect(() => {
        const io = new IntersectionObserver(entries => {
            for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
        }, { threshold: 0.05 });
        document.querySelectorAll('[data-reveal]:not(.is-in)').forEach(el => io.observe(el));
        return () => io.disconnect();
    }, [visibleProducts, loading, adminOpen]);

    function saveClaims(next) {
        setClaims(next);
        try { localStorage.setItem(CLAIMS_KEY, JSON.stringify(next)); } catch { /* private mode: token lasts this visit only */ }
    }

    async function reserve(product) {
        if (!supabase || product.claimed_at) return;
        setReservingId(product.id); setError(''); setNotice(null);
        const token = crypto.randomUUID();
        const { error } = await supabase.rpc('claim_product', { p_product_id: product.id, p_token: token, p_code: INVITE });
        if (error) setError(`Não foi possível reservar «${product.name}». Pode já ter sido reservado por outra pessoa. Recarrega a página e tenta de novo.`);
        else {
            saveClaims({ ...claims, [product.id]: token });
            setNotice({ text: `«${product.name}» está reservado para ti. Quando o comprares, marca-o como comprado.` });
            await loadProducts();
        }
        setReservingId(null); setConfirmingId(null);
    }

    // release = undo the reservation, purchase = final state; both need this browser's token
    async function changeClaim(product, action) {
        const release = action === 'release';
        if (release && !window.confirm(`Cancelar a reserva de «${product.name}»? Volta a ficar disponível para outra pessoa.`)) return;
        setReservingId(product.id); setError(''); setNotice(null);
        const { error } = await supabase.rpc(release ? 'release_product' : 'mark_purchased',
            { p_product_id: product.id, p_token: claims[product.id] });
        if (error) setError(`Não foi possível atualizar «${product.name}». Recarrega a página e tenta de novo.`);
        else {
            if (release) { const { [product.id]: _, ...rest } = claims; saveClaims(rest); }
            setNotice({ text: release ? `Reserva de «${product.name}» cancelada.` : `«${product.name}» marcado como comprado. Obrigada!` });
            await loadProducts();
        }
        setReservingId(null);
    }

    async function login(e) {
        e.preventDefault(); setError('');
        const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
        if (error) setError('Email ou palavra-passe incorretos.');
        else { setLoginPassword(''); setNotice({ text: 'Sessão iniciada.' }); }
    }

    async function logout() {
        await supabase.auth.signOut();
        setAdmin(false); setSession(null);
    }

    async function copyInvite() {
        const { data } = await supabase.rpc('guest_code');
        if (!data) { setError('Não foi possível obter o link de convite.'); return; }
        await navigator.clipboard.writeText(`${location.origin}${location.pathname}#convite-${data}`);
        setNotice({ text: 'Link de convite copiado. Partilha-o com a família e não o abras tu.' });
    }

    function startEdit(product) {
        setEditingId(product.id);
        setForm({
            name: product.name || '', brand: product.brand || '', store: product.store || '',
            price: product.price ?? '', size: product.size || '', color: product.color || '',
            description: product.description || '', purchase_url: product.purchase_url || '',
            image_url: product.image_url || '', category: product.category || ''
        });
        adminRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    async function saveProduct(e) {
        e.preventDefault(); setSaving(true); setError(''); setNotice(null);
        const payload = {
            ...form,
            price: form.price === '' ? null : Number(form.price),
            updated_at: new Date().toISOString()
        };
        const result = editingId
            ? await supabase.from('products').update(payload).eq('id', editingId)
            : await supabase.from('products').insert(payload);
        if (result.error) setError(`Não foi possível guardar. (${result.error.message})`);
        else {
            setNotice({ text: editingId ? 'Alterações guardadas.' : 'Presente adicionado à lista.' });
            setForm(emptyForm); setEditingId(null); await loadProducts();
        }
        setSaving(false);
    }

    async function deleteProduct(product) {
        if (!window.confirm(`Apagar «${product.name}» da lista? Não dá para desfazer.`)) return;
        const { error } = await supabase.from('products').delete().eq('id', product.id);
        if (error) setError(`Não foi possível apagar. (${error.message})`);
        else { setNotice({ text: 'Presente apagado.' }); await loadProducts(); }
    }

    const field = key => ({ value: form[key], onChange: e => setForm({ ...form, [key]: e.target.value }) });

    if (!isSupabaseConfigured) {
        return <main className="setup"><div className="setup-card"><h1>Wishlist</h1><p>Faltam as credenciais do Supabase no ficheiro <code>.env</code>. Copia <code>.env.example</code> e preenche os valores.</p></div></main>;
    }

    return (
        <div className="app-shell">
            <Snowfall />
            <header className="topbar">
                <div className="brand-group">
                    <ChristmasDog kind="pug" />
                    <a className="brandmark" href="#inicio">Wishlist</a>
                    <ChristmasDog kind="yorkie" />
                </div>
            </header>

            <section className="hero" id="inicio">
                <div className="hero-photo" role="img" aria-label="Sala decorada para o Natal, com árvore e lareira acesa" />
                <div className="hero-copy">
                    <span className="eyebrow">UM PEQUENO GUIA</span>
                    <h1>Como funciona?</h1>
                    <p className="hero-lead">Um presente de cada vez, sem surpresas repetidas.</p>
                    <div className="howto">
                        <div><b>01</b><p><strong>Escolhe</strong><br />Explora a lista e carrega na fotografia para abrir a página do produto na loja.</p></div>
                        <div><b>02</b><p><strong>Reserva antes de comprar</strong><br />Carrega em «Eu quero comprar isto». O presente fica guardado para ti e mais ninguém o pode escolher.</p></div>
                        <div><b>03</b><p><strong>Compra e avisa</strong><br />Depois de o comprares, volta aqui e carrega em «Já comprei».</p></div>
                        <div><b>04</b><p><strong>Mudaste de ideias?</strong><br />Carrega em «Cancelar reserva» no mesmo telemóvel ou computador, e o presente volta a ficar disponível.</p></div>
                    </div>
                </div>
            </section>

            <main id="wishlist" className="wishlist-section">
                <div className="section-heading" data-reveal>
                    <h2>Wishlist</h2>
                </div>

                {categories.length > 2 && <div className="category-row" data-reveal role="group" aria-label="Filtrar por categoria">
                    <span className="ornament">✦</span>
                    {categories.map(([c, n]) => (
                        <button key={c} className="category" aria-pressed={category === c} onClick={() => setCategory(c)}>
                            {c}
                        </button>
                    ))}
                    <span className="ornament">✦</span>
                </div>}

                {error && <div className="message error" role="alert">{error}<button className="icon-button" onClick={() => setError('')} aria-label="Fechar aviso"><X size={16} /></button></div>}
                {!loading && !showStates && !admin && <p className="message invite-hint">Para veres o que ainda está disponível e reservares um presente, abre o link de convite que recebeste.</p>}
                {loading ? <p className="empty-state">A carregar presentes...</p> :
                    visibleProducts.length === 0 ? <div className="empty-state">
                        <p>{products.length === 0 ? 'A lista ainda está vazia. Volta daqui a uns dias.' : 'Não há presentes nesta categoria.'}</p>
                        {category !== 'Todos' && <button className="secondary-button" onClick={() => setCategory('Todos')}>Ver todos os presentes</button>}
                    </div> :
                        <div className="gift-grid">
                            {visibleProducts.map(p => {
                                const state = showStates ? stateOf(p) : 'available';
                                const mine = Boolean(claims[p.id]);
                                const busy = reservingId === p.id;
                                return (
                                    <article className={`gift-card is-${state}`} key={p.id} data-reveal>
                                        <a className="gift-image" href={p.purchase_url || undefined}
                                            target={p.purchase_url ? '_blank' : undefined}
                                            rel={p.purchase_url ? 'noreferrer' : undefined}
                                            aria-label={p.purchase_url ? `Ver ${p.name} na loja (abre noutro separador)` : p.name}>
                                            {p.image_url ? <img src={p.image_url} alt="" loading="lazy" /> : <div className="image-placeholder"><Gift size={38} /><span>UM PRESENTE ESPECIAL</span></div>}
                                            {showStates && <span className={`status status-${state}`}><i />{STATE_LABEL[state]}</span>}
                                            {p.purchase_url && <span className="image-link"><ExternalLink size={14} /> Ver produto</span>}
                                        </a>
                                        <div className="gift-info">
                                            <h3>{p.name}</h3>
                                            {(p.brand || p.store) && <p className="gift-subtitle">{[p.brand, p.store].filter(Boolean).join(' · ')}</p>}
                                            <div className="product-details">
                                                {p.size && <span>Tamanho: {p.size}</span>}
                                                {p.color && <span>Cor: {p.color}</span>}
                                            </div>
                                            {p.price != null && <p className="price">{formatPrice(p.price)}</p>}
                                            {p.description && p.description.trim() !== '-' && <p className="gift-description">{p.description}</p>}
                                            {showStates && <div className="gift-actions">
                                                {state === 'purchased'
                                                    ? <button className="reserve-button reserved" disabled><Check size={17} /> {mine ? 'Compraste este presente' : 'Presente comprado'}</button>
                                                    : state === 'reserved'
                                                        ? mine
                                                            ? <>
                                                                <button className="reserve-button" onClick={() => changeClaim(p, 'purchase')} disabled={busy}><Check size={17} /> Já comprei</button>
                                                                <button className="text-button" onClick={() => changeClaim(p, 'release')} disabled={busy}>Cancelar reserva</button>
                                                            </>
                                                            : <button className="reserve-button reserved" disabled><Check size={17} /> Presente reservado</button>
                                                        : confirmingId === p.id
                                                            ? <>
                                                                <button className="reserve-button" onClick={() => reserve(p)} disabled={busy} autoFocus><Check size={17} /> {busy ? 'A reservar...' : 'Confirmar reserva'}</button>
                                                                <button className="text-button" onClick={() => setConfirmingId(null)} disabled={busy}>Cancelar</button>
                                                            </>
                                                            : <button className="reserve-button" onClick={() => setConfirmingId(p.id)}><Gift size={17} /> Eu quero comprar isto</button>}
                                            </div>}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                }
            </main>

            {adminOpen && <section className="admin-panel" ref={adminRef} aria-labelledby="admin-title">
                <div className="admin-heading"><h2 id="admin-title">Gerir a lista</h2><button className="icon-button" onClick={() => setAdminOpen(false)} aria-label="Fechar área privada"><X /></button></div>
                {!admin ? <form className="login-form" onSubmit={login}>
                    <p>Só para quem gere a lista. Entra com a tua conta de administração.</p>
                    <label>Email<input type="email" autoComplete="username" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required /></label>
                    <label>Palavra-passe<input type="password" autoComplete="current-password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required /></label>
                    <button className="primary-button" type="submit">Entrar</button>
                    {session && <p className="muted">Tens sessão iniciada, mas esta conta não tem permissão para gerir a lista.</p>}
                </form> : <div className="admin-tools">
                    <div className="admin-heading"><p className="success-text">Sessão de administração iniciada</p><button className="text-button" onClick={logout}><LogOut size={15} /> Terminar sessão</button></div>
                    <p className="privacy-note">Com a tua sessão iniciada não vês reservas nem compras. Os estados só aparecem a quem abre o link de convite. <button className="text-button" onClick={copyInvite}>Copiar link de convite</button></p>
                    <form className="product-form" onSubmit={saveProduct}>
                        <h3>{editingId ? 'Editar presente' : 'Adicionar presente'}</h3>
                        <div className="form-grid">
                            <label>Nome *<input {...field('name')} required /></label>
                            <label>Categoria<input {...field('category')} placeholder="Ex.: Moda, Casa" list="category-options" /></label>
                            <label>Marca<input {...field('brand')} /></label>
                            <label>Loja<input {...field('store')} /></label>
                            <label>Preço (€)<input type="number" inputMode="decimal" min="0" step="0.01" {...field('price')} /></label>
                            <label>Tamanho<input {...field('size')} /></label>
                            <label>Cor<input {...field('color')} /></label>
                            <label>Link da imagem<input type="url" {...field('image_url')} placeholder="https://" /></label>
                            <label className="wide">Link da loja<input type="url" {...field('purchase_url')} placeholder="https://" /></label>
                            <label className="wide">Descrição<textarea rows="3" {...field('description')} /></label>
                        </div>
                        <datalist id="category-options">{categories.slice(1).map(([c]) => <option key={c} value={c} />)}</datalist>
                        <div className="form-actions"><button className="primary-button" disabled={saving}>{saving ? 'A guardar...' : editingId ? 'Guardar alterações' : 'Adicionar presente'}</button>{editingId && <button type="button" className="text-button" onClick={() => { setEditingId(null); setForm(emptyForm) }}>Cancelar edição</button>}</div>
                    </form>
                    <h3 className="manage-title">Na lista ({products.length})</h3>
                    <ul className="manage-list">{products.map(p => <li className="manage-row" key={p.id}><span>{p.name}</span><div><button className="icon-button" onClick={() => startEdit(p)} aria-label={`Editar ${p.name}`}><Pencil size={16} /></button><button className="icon-button danger" onClick={() => deleteProduct(p)} aria-label={`Apagar ${p.name}`}><Trash2 size={16} /></button></div></li>)}</ul>
                </div>}
            </section>}

            <footer className="footer" data-reveal>
                <button className="admin-link" onClick={() => setAdminOpen(v => !v)} aria-expanded={adminOpen}>
                    <LockKeyhole size={14} /> Área privada
                </button>
            </footer>

            {notice && <div className="toast" role="status">
                <Check size={18} aria-hidden="true" />
                <span>{notice.text}</span>
                <button className="icon-button" onClick={() => setNotice(null)} aria-label="Fechar"><X size={16} /></button>
            </div>}
        </div>
    );
}
