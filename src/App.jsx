import React, { useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { Gift, LockKeyhole, LogOut, Plus, X, ExternalLink, Check, Pencil, Trash2 } from 'lucide-react';

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
      const count = Math.min(width < 700 ? 22 : 52, Math.max(12, Math.round(width / 25)));
      flakes = Array.from({ length: count }, () => ({
        x: Math.random() * width, y: Math.random() * height,
        r: .7 + Math.random() * 1.8, speed: .25 + Math.random() * .65,
        drift: .15 + Math.random() * .35, phase: Math.random() * Math.PI * 2,
        alpha: .22 + Math.random() * .35
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
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

const SNOW_BITS = [[-26,-18],[-18,-30],[-8,-34],[6,-32],[18,-28],[28,-16],[-30,-4],[30,-2],[-22,8],[24,10],[-12,-24],[12,-22]];

function ChristmasDog({ kind }) {
  const pug = kind === 'pug';
  const id = pug ? 'pug' : 'yorkie';
  // hat + snow sit on top of each photo's head, so positions differ per dog
  const hat = pug ? 'translate(8 4) rotate(-14 40 20)' : 'translate(22 2) rotate(12 40 20)';
  const head = pug ? { x: 44, y: 20 } : { x: 54, y: 22 };
  return (
    <svg className={`christmas-dog christmas-dog-${id}`} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-snow`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff"/>
          <stop offset="1" stopColor="#d6e3e8"/>
        </linearGradient>
        <linearGradient id={`${id}-hat`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d23a43"/>
          <stop offset="1" stopColor="#8e1b25"/>
        </linearGradient>
        <radialGradient id={`${id}-hole`}>
          <stop offset="0" stopColor="#7d929c"/>
          <stop offset="1" stopColor="#c3d3d9"/>
        </radialGradient>
        <clipPath id={`${id}-clip`}><rect x="-20" y="-40" width="140" height="124"/></clipPath>
      </defs>
      <ellipse cx="50" cy="83" rx="36" ry="7" fill={`url(#${id}-hole)`}/>
      <g clipPath={`url(#${id}-clip)`}>
        <g className="dog-emerge">
          <g className="dog-shake"><g transform="translate(0 -7)">
            <image href={`${import.meta.env.BASE_URL}dog-${id}.webp`} x="8" y="8" width="84" height="84"/>
            <g transform={hat}>
              <path d="M18 26 Q30 2 54 6 Q66 9 70 22 Q50 16 22 30Z" fill={`url(#${id}-hat)`}/>
              <path d="M54 6 Q68 4 74 16" fill="none" stroke="#8e1b25" strokeWidth="5" strokeLinecap="round"/>
              <circle cx="75" cy="18" r="5.5" fill="#fbf7f0"/>
              <path d="M15 30 Q42 15 72 23 Q74 28 71 31 Q43 23 18 37 Q13 35 15 30Z" fill="#fbf7f0"/>
            </g>
            <g className="dog-snow-cap" fill={`url(#${id}-snow)`}>
              <path d={`M${head.x - 24} ${head.y + 6} q4 -12 14 -10 q6 -9 16 -4 q10 -3 14 8 q6 2 4 8 q-24 -6 -48 -2Z`}/>
              <circle cx={head.x - 14} cy={head.y + 26} r="4.5"/><circle cx={head.x + 16} cy={head.y + 22} r="3.8"/>
              <circle cx={head.x + 2} cy={head.y + 34} r="2.6"/><circle cx={head.x - 22} cy={head.y + 14} r="3"/>
            </g>
          </g></g>
        </g>
      </g>
      <g className="dog-burst" transform={`translate(${head.x} ${head.y + 5})`} fill="#fff">
        {SNOW_BITS.map(([dx, dy], i) => (
          <circle key={i} r={1 + (i % 3) * 0.6} style={{ '--dx': `${dx}px`, '--dy': `${dy}px` }}/>
        ))}
      </g>
      <path className="dog-snowbank" d="M2 86 C9 80 14 78 22 81 C29 74 40 77 46 82 C55 75 66 77 72 82 C81 78 91 80 98 87 L98 100 L2 100Z" fill={`url(#${id}-snow)`}/>
      <path d="M7 89 C17 83 23 84 31 87 M43 86 C52 81 61 83 67 87 M76 87 C83 83 89 85 94 89" fill="none" stroke="#c8d9df" strokeWidth="1.3" opacity=".72"/>
      <g fill="#fff" opacity=".9"><circle cx="18" cy="82" r="2.2"/><circle cx="42" cy="80" r="1.6"/><circle cx="80" cy="82" r="2"/></g>
    </svg>
  );
}
function ChristmasDogs() {
  return (
    <div className="christmas-dogs" aria-hidden="true">
      <ChristmasDog kind="pug" />
      <ChristmasDog kind="yorkie" />
    </div>
  );
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [adminOpen, setAdminOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [admin, setAdmin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [reservingId, setReservingId] = useState(null);
  const [category, setCategory] = useState('Todos');

  const categories = useMemo(
    () => ['Todos', ...new Set(products.map(p => p.category).filter(Boolean))],
    [products]
  );
  const visibleProducts = useMemo(
    () => category === 'Todos' ? products : products.filter(p => p.category === category),
    [products, category]
  );

  async function loadProducts() {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setProducts(data || []);
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

  async function reserve(product) {
    if (!supabase || product.claimed_at) return;
    setReservingId(product.id); setError(''); setNotice('');
    // Reserva anónima: não enviamos nem pedimos o nome de quem reserva.
    const { error } = await supabase.rpc('reserve_product', {
      p_product_id: product.id,
      p_guest_name: null
    });
    if (error) setError(error.message);
    else {
      setNotice('Reserva confirmada! Obrigada por ajudares a evitar presentes duplicados. ✨');
      await loadProducts();
    }
    setReservingId(null);
  }

  async function login(e) {
    e.preventDefault(); setError('');
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    if (error) setError(error.message);
    else { setLoginPassword(''); setNotice('Sessão iniciada.'); }
  }

  async function logout() {
    await supabase.auth.signOut();
    setAdmin(false); setSession(null);
  }

  function startEdit(product) {
    setEditingId(product.id);
    setForm({
      name: product.name || '', brand: product.brand || '', store: product.store || '',
      price: product.price ?? '', size: product.size || '', color: product.color || '',
      description: product.description || '', purchase_url: product.purchase_url || '',
      image_url: product.image_url || '', category: product.category || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveProduct(e) {
    e.preventDefault(); setSaving(true); setError(''); setNotice('');
    const payload = {
      ...form,
      price: form.price === '' ? null : Number(form.price),
      updated_at: new Date().toISOString()
    };
    const result = editingId
      ? await supabase.from('products').update(payload).eq('id', editingId)
      : await supabase.from('products').insert(payload);
    if (result.error) setError(result.error.message);
    else {
      setNotice(editingId ? 'Presente atualizado.' : 'Presente adicionado.');
      setForm(emptyForm); setEditingId(null); await loadProducts();
    }
    setSaving(false);
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Queres apagar "${product.name}"?`)) return;
    const { error } = await supabase.from('products').delete().eq('id', product.id);
    if (error) setError(error.message);
    else { setNotice('Presente apagado.'); await loadProducts(); }
  }

  if (!isSupabaseConfigured) {
    return <main className="setup"><div className="setup-card"><span className="eyebrow">UM NATAL ESPECIAL</span><h1>Wishlist</h1><p>Falta configurar as credenciais do Supabase no ficheiro <code>.env</code>.</p></div></main>;
  }

  return (
    <div className="app-shell">
      <Snowfall />
      <header className="topbar">
        <img className="holly holly-left" src={`${import.meta.env.BASE_URL}holly-sprig.png`} alt="" aria-hidden="true" />
        <div className="brand-group">
          <ChristmasDog kind="pug" />
          <a className="brandmark" href="#inicio">Wishlist</a>
          <ChristmasDog kind="yorkie" />
        </div>
        <img className="holly holly-right" src={`${import.meta.env.BASE_URL}holly-sprig.png`} alt="" aria-hidden="true" />
      </header>

      <section className="hero" id="inicio">
        <div className="hero-photo" />
        <div className="hero-copy">
          <span className="eyebrow">UM PEQUENO GUIA</span>
          <h1>Como funciona?</h1>
          <p className="hero-lead">Um presente de cada vez, sem surpresas repetidas.</p>
          <div className="howto">
            <div><b>01</b><p><strong>Escolhe</strong><br/>Explora a lista e carrega na fotografia para abrir a página do produto.</p></div>
            <div><b>02</b><p><strong>Reserva antes de comprar</strong><br/>Carrega em «Eu quero comprar isto» primeiro. Assim evitamos presentes duplicados.</p></div>
            <div><b>03</b><p><strong>A surpresa fica guardada</strong><br/>O presente passa a aparecer como reservado. Não consigo ver quem reservou o quê.</p></div>
          </div>
        </div>
      </section>

      <main id="wishlist" className="wishlist-section">
        <div className="section-heading">
          <h2>Wishlist</h2>
          <p>Lembra-te: reserva sempre antes de fazeres a compra e ao carregares na imagem do produto podes comprar diretamente no site</p>
        </div>

        <div className="category-row" id="categorias">
          <span className="ornament">✦</span>
          {categories.map(c => <button key={c} className={category === c ? 'category active' : 'category'} onClick={() => setCategory(c)}>{c}</button>)}
          <span className="ornament">✦</span>
        </div>

        {error && <div className="message error">{error}</div>}
        {notice && <div className="message success">{notice}</div>}
        {loading ? <p className="empty-state">A preparar a lista...</p> :
          visibleProducts.length === 0 ? <p className="empty-state">Ainda não há presentes nesta categoria.</p> :
          <div className="gift-grid">
            {visibleProducts.map(p => (
              <article className={`gift-card ${p.claimed_at ? 'is-claimed' : ''}`} key={p.id}>
                <a className="gift-image" href={p.purchase_url || undefined}
                   target={p.purchase_url ? '_blank' : undefined}
                   rel={p.purchase_url ? 'noreferrer' : undefined}
                   aria-label={p.purchase_url ? `Ver ${p.name} na loja` : p.name}
                   onClick={e => { if (!p.purchase_url) e.preventDefault(); }}>
                  {p.image_url ? <img src={p.image_url} alt={p.name}/> : <div className="image-placeholder"><Gift size={38}/><span>UM PRESENTE ESPECIAL</span></div>}
                  <span className={`status ${p.claimed_at ? 'claimed' : 'available'}`}>
                    <i />{p.claimed_at ? 'Reservado' : 'Disponível'}
                  </span>
                  {p.purchase_url && <span className="image-link"><ExternalLink size={14}/> Ver produto</span>}
                </a>
                <div className="gift-info">
                  <h3>{p.name}</h3>
                  {(p.brand || p.store) && <p className="gift-subtitle">{[p.brand, p.store].filter(Boolean).join(' · ')}</p>}
                  <div className="product-details">
                    {p.size && <span>Tamanho: {p.size}</span>}
                    {p.color && <span>Cor: {p.color}</span>}
                  </div>
                  {p.price != null && <p className="price">{Number(p.price).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</p>}
                  {p.description && <p className="gift-description">{p.description}</p>}
                  {p.claimed_at
                    ? <button className="reserve-button reserved" disabled><Check size={17}/> Presente reservado</button>
                    : <button className="reserve-button" onClick={() => reserve(p)} disabled={reservingId === p.id}>
                        <Gift size={17}/> {reservingId === p.id ? 'A reservar...' : 'Eu quero comprar isto'}
                      </button>}
                </div>
              </article>
            ))}
          </div>
        }
      </main>

      <footer className="footer"><span>FEITO COM ♡ E ESPÍRITO DE NATAL</span><button className="admin-link" onClick={() => setAdminOpen(v => !v)}><LockKeyhole size={14}/> Área privada</button></footer>

      {adminOpen && <section className="admin-panel">
        <div className="admin-heading"><div><span className="eyebrow">GESTÃO</span><h2>Área de administração</h2></div><button className="icon-button" onClick={() => setAdminOpen(false)} aria-label="Fechar"><X/></button></div>
        {!admin ? <form className="login-form" onSubmit={login}>
          <p>Entra com a conta de administrador criada no Supabase.</p>
          <label>Email<input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required /></label>
          <label>Palavra-passe<input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required /></label>
          <button className="primary-button" type="submit">Entrar</button>
          {session && <p className="muted">A conta está autenticada, mas não tem permissões de administração.</p>}
        </form> : <div className="admin-tools">
          <div className="admin-heading"><p className="success-text">Sessão de administrador ativa</p><button className="text-button" onClick={logout}><LogOut size={15}/> Terminar sessão</button></div>
          <p className="privacy-note">As reservas são anónimas: esta área mostra apenas se um presente está reservado, nunca quem o reservou.</p>
          <form className="product-form" onSubmit={saveProduct}>
            <h3>{editingId ? 'Editar presente' : 'Adicionar presente'}</h3>
            <div className="form-grid">
              <label>Nome do presente *<input value={form.name} onChange={e => setForm({...form, name:e.target.value})} required /></label>
              <label>Categoria<input value={form.category} onChange={e => setForm({...form, category:e.target.value})} placeholder="Ex.: Moda, Casa..." /></label>
              <label>Marca<input value={form.brand} onChange={e => setForm({...form, brand:e.target.value})} /></label>
              <label>Loja<input value={form.store} onChange={e => setForm({...form, store:e.target.value})} /></label>
              <label>Preço<input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({...form, price:e.target.value})} /></label>
              <label>Tamanho<input value={form.size} onChange={e => setForm({...form, size:e.target.value})} /></label>
              <label>Cor<input value={form.color} onChange={e => setForm({...form, color:e.target.value})} /></label>
              <label>URL da imagem<input type="url" value={form.image_url} onChange={e => setForm({...form, image_url:e.target.value})} placeholder="https://..." /></label>
              <label className="wide">Link de compra<input type="url" value={form.purchase_url} onChange={e => setForm({...form, purchase_url:e.target.value})} placeholder="https://..." /></label>
              <label className="wide">Descrição<textarea rows="3" value={form.description} onChange={e => setForm({...form, description:e.target.value})}/></label>
            </div>
            <div className="form-actions"><button className="primary-button" disabled={saving}>{saving ? 'A guardar...' : editingId ? 'Guardar alterações' : 'Adicionar presente'}</button>{editingId && <button type="button" className="text-button" onClick={() => {setEditingId(null);setForm(emptyForm)}}>Cancelar edição</button>}</div>
          </form>
          <h3 className="manage-title">Os teus presentes ({products.length})</h3>
          <div className="manage-list">{products.map(p => <div className="manage-row" key={p.id}><span>{p.name} {p.claimed_at && <small>· Reservado</small>}</span><div><button className="icon-button" onClick={() => startEdit(p)} aria-label="Editar"><Pencil size={16}/></button><button className="icon-button danger" onClick={() => deleteProduct(p)} aria-label="Apagar"><Trash2 size={16}/></button></div></div>)}</div>
        </div>}
      </section>}
    </div>
  );
}
