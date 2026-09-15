/* LADENNE. — app.js
   方針：JSが動かなくても中身は最初から見えている（表示をJSに依存させない）。
   JSは「切り替え」「開閉」「カート」だけを足す。 */
(() => {
'use strict';
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const yen = n => '¥' + Number(n).toLocaleString('ja-JP');

/* ---------------- アナウンスバー ---------------- */
(() => {
  const items = $$('.announce__item');
  if (items.length < 2) return;
  let i = 0;
  const show = n => { items.forEach((el, k) => el.classList.toggle('is-on', k === n)); i = n; };
  const go = d => show((i + d + items.length) % items.length);
  $$('.announce__nav').forEach(b => b.addEventListener('click', () => go(b.dataset.ann === 'next' ? 1 : -1)));
  let t = setInterval(() => go(1), 5000);
  $('.announce')?.addEventListener('mouseenter', () => clearInterval(t));
  $('.announce')?.addEventListener('mouseleave', () => { t = setInterval(() => go(1), 5000); });
})();

/* ---------------- ヒーロー スライドショー ---------------- */
(() => {
  const hero = $('[data-hero]');
  if (!hero) return;
  const slides = $$('.hero__slide', hero);
  const dots = $$('.hero__dots button', hero);
  if (slides.length < 2) return;
  let i = 0, timer;
  const show = n => {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('is-on', k === i));
    dots.forEach((d, k) => d.classList.toggle('is-on', k === i));
  };
  const start = () => { stop(); timer = setInterval(() => show(i + 1), 6000); };
  const stop = () => clearInterval(timer);
  dots.forEach(d => d.addEventListener('click', () => { show(+d.dataset.i); start(); }));
  hero.addEventListener('mouseenter', stop);
  hero.addEventListener('mouseleave', start);
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) start();
})();

/* ---------------- ドロワー（メニュー / 検索） ---------------- */
$$('[data-open]').forEach(btn => btn.addEventListener('click', () => {
  const d = $(btn.dataset.open);
  if (!d) return;
  d.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  d.querySelector('input')?.focus();
}));
$$('.drawer').forEach(d => {
  d.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) { d.classList.remove('is-open'); document.body.style.overflow = ''; }
  });
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  $$('.drawer.is-open').forEach(d => d.classList.remove('is-open'));
  document.body.style.overflow = '';
});

/* ---------------- カルーセル ---------------- */
$$('.carousel').forEach(c => {
  const track = $('.carousel__track', c);
  const step = () => (track.firstElementChild?.getBoundingClientRect().width || 300) + 16;
  $$('.carousel__btn', c).forEach(b => b.addEventListener('click', () => {
    track.scrollBy({ left: (b.dataset.dir === 'next' ? 1 : -1) * step() * 2, behavior: 'smooth' });
  }));
});

/* ---------------- タブ ---------------- */
$$('[data-tabs]').forEach(tabs => {
  const scope = tabs.parentElement;
  $$('button', tabs).forEach(btn => btn.addEventListener('click', () => {
    $$('button', tabs).forEach(b => b.classList.toggle('is-on', b === btn));
    $$('.tabpanel', scope).forEach(p => p.classList.toggle('is-on', p.dataset.panel === btn.dataset.tab));
  }));
});

/* ---------------- アコーディオン ---------------- */
$$('.acc__btn').forEach(b => b.addEventListener('click', () => b.closest('.acc').classList.toggle('is-open')));

/* ---------------- 絞り込みドロップダウン ---------------- */
$$('[data-fdrop]').forEach(d => {
  d.querySelector('button').addEventListener('click', e => {
    e.stopPropagation();
    const open = d.classList.contains('is-open');
    $$('[data-fdrop]').forEach(x => x.classList.remove('is-open'));
    d.classList.toggle('is-open', !open);
  });
});
document.addEventListener('click', () => $$('[data-fdrop]').forEach(d => d.classList.remove('is-open')));

/* ---------------- スクロールで出す（JSが無ければ最初から見えている） ---------------- */
(() => {
  const els = $$('.reveal');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('is-in')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  els.forEach(e => io.observe(e));
})();

/* =========================================================
   カート（ブラウザ内に保存するだけの仮実装。
   本番は Shopify のカートに置き換える）
   ========================================================= */
// 店舗ごとに別のカート（CRAFT と APPAREL は別のお店）
const SHOP = location.pathname.includes('/apparel/') ? 'apparel' : 'craft';
const CART_KEY = 'ladenne.cart.' + SHOP;
const readCart  = () => { try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; } };
const writeCart = c => { try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch {} paintCount(); };
function paintCount() {
  const n = readCart().reduce((a, i) => a + i.qty, 0);
  $$('[data-cart-count]').forEach(el => { el.textContent = n; el.style.display = n ? '' : 'none'; });
}
paintCount();

$('[data-add-to-cart]')?.addEventListener('click', function () {
  const name  = $('[data-title]')?.textContent.trim() || '商品';
  const price = Number(($('[data-price]')?.textContent || '0').replace(/[^\d]/g, ''));
  const color = $('[data-colorname]')?.textContent.trim() || '';
  const size  = $('[data-sizename]')?.textContent.trim() || '';
  const sku   = $('[data-sku]')?.textContent.trim() || '';
  const img   = $('[data-main-img]')?.getAttribute('src') || '';
  const key   = sku + '/' + color + '/' + size;
  const cart  = readCart();
  const hit   = cart.find(i => i.key === key);
  hit ? hit.qty++ : cart.push({ key, sku, name, color, size, price, img, qty: 1 });
  writeCart(cart);
  const t = this.textContent;
  this.textContent = 'カートに追加しました';
  setTimeout(() => { this.textContent = t; }, 1600);
});

/* カートページ */
(() => {
  const root = $('[data-cart]');
  if (!root) return;
  const rows = $('[data-cart-rows]');
  const empty = $('[data-cart-empty]');
  const render = () => {
    const cart = readCart();
    empty.hidden = cart.length > 0;
    rows.innerHTML = cart.map((i, n) => `
      <div class="cart-row">
        ${i.img ? `<img src="${i.img}" alt="${i.name}">` : `<div class="ph" data-label="${i.name}"></div>`}
        <div>
          <div style="font-size:12px;line-height:1.6">${i.name}</div>
          <div style="font-size:11px;color:var(--fg-muted);margin-top:6px">カラー：${i.color}${i.size ? '／サイズ：' + i.size : ''}／品番：${i.sku}</div>
          <div class="qty" style="margin-top:14px">
            <button data-q="-1" data-n="${n}" aria-label="数量を減らす">−</button>
            <input value="${i.qty}" readonly aria-label="数量">
            <button data-q="1" data-n="${n}" aria-label="数量を増やす">＋</button>
          </div>
          <button data-del="${n}" style="margin-top:12px;font-size:11px;text-decoration:underline">削除する</button>
        </div>
        <div style="font-size:12px;white-space:nowrap">${yen(i.price * i.qty)}</div>
      </div>`).join('');
    const sub = cart.reduce((a, i) => a + i.price * i.qty, 0);
    const ship = sub === 0 ? 0 : (sub >= 5000 ? 0 : 770);
    $('[data-sub]').textContent   = yen(sub);
    $('[data-ship]').textContent  = sub === 0 ? '—' : (ship === 0 ? '無料' : yen(ship));
    $('[data-total]').textContent = yen(sub + ship);
  };
  rows.addEventListener('click', e => {
    const q = e.target.closest('[data-q]'), d = e.target.closest('[data-del]');
    const cart = readCart();
    if (q) { const i = cart[+q.dataset.n]; i.qty = Math.max(1, i.qty + Number(q.dataset.q)); }
    else if (d) { cart.splice(+d.dataset.del, 1); }
    else return;
    writeCart(cart); render();
  });
  $('[data-checkout]')?.addEventListener('click', () => {
    alert('決済はまだ接続していません。\n本番では Shopify の決済画面につなぎます。');
  });
  render();
})();

/* =========================================================
   商品ページ：?id= で商品を差し替え／カラー選択
   ========================================================= */
(() => {
  const page = $('[data-product-page]');
  if (!page) return;
  let list = [];
  try { list = JSON.parse(page.dataset.images || '[]'); } catch {}
  const main = $('[data-main-img]');
  $$('.swatch').forEach(sw => sw.addEventListener('click', () => {
    $$('.swatch').forEach(s => s.classList.remove('is-on'));
    sw.classList.add('is-on');
    const n = $('[data-colorname]'); if (n) n.textContent = sw.dataset.name || '';
    const i = Number(sw.dataset.i);
    if (main && list[i]) { main.style.opacity = '0'; setTimeout(() => { main.src = list[i]; main.style.opacity = ''; }, 140); }
  }));
  // サムネイルを押してもメインが変わる
  $$('.pdp__thumbs img').forEach(t => t.addEventListener('click', () => {
    if (main) main.src = t.getAttribute('src');
  }));
  // サイズ
  $$('[data-sizes] .size').forEach(b => b.addEventListener('click', () => {
    $$('[data-sizes] .size').forEach(x => x.classList.toggle('is-on', x === b));
    const n = $('[data-sizename]'); if (n) n.textContent = b.dataset.size;
  }));
})();

/* =========================================================
   一覧ページ：?c= / ?q= で絞り込み・並び替え・列数
   ========================================================= */
(() => {
  const grid = $('[data-grid]');
  if (!grid) return;
  const cards = $$('.pcard', grid);
  const params = new URLSearchParams(location.search);
  const c = params.get('c'), q = (params.get('q') || '').trim();

  // カテゴリごとの 名前 / 説明 / ヘッダー写真 / 絞り込みの条件
  const CAT = {
    apparel: ['服',              '革を着る、という選択肢。<br>アウター、トップス、ボトムスまで一着ずつ',        'cat-apparel', p => p.cat === 'apparel'],
    outer:   ['アウター',         'ライダース、ブルゾン、コート。<br>羽織るだけで背筋が伸びるもの',              'cat-outer',   p => p.sub2 === 'outer'],
    tops:    ['トップス',         'シャツ、ニット、カットソー。<br>一枚で成立する、静かな服',                    'cat-tops',    p => p.sub2 === 'tops'],
    bottoms: ['ボトムス',         'レザー、ウール、デニム。<br>上に合わせても負けない一本',                      'cat-bottoms', p => p.sub2 === 'bottoms'],
    wallet:  ['財布・カードケース','毎日手に取るものだから、触り心地から選ぶ<br>上質なレザーの財布とカードケース','cat-wallet',  p => p.cat === 'wallet'],
    leather: ['レザー小物',       '鍵、眼鏡、旅券。毎日手に取る道具だからこそ<br>触れたときに気持ちのいいものを','cat-leather', p => p.cat === 'leather'],
    phone:   ['スマホケース',     '手のなかで一番長く触れる道具を、革で包む<br>手帳型・背面型・ストラップ付き',  'cat-phone',   p => p.cat === 'phone'],
    travel:  ['トラベル',         '移動の時間を、静かで心地よいものに<br>スーツケースと旅の道具',                'cat-travel',  p => p.cat === 'travel'],
    new:     ['新作',             '今シーズン入荷したもの',                                                     'cat-new',     p => p.tags.includes('new')],
    popular: ['人気商品',         'よく選ばれているもの',                                                       'cat-popular', p => p.tags.includes('popular')],
    pickup:  ['Pick Up',          '今おすすめしたいもの',                                                       'cat-pickup',  p => p.tags.includes('pickup')],
    autumn:  ['オータム コレクション','深い色を揃えた、秋のひと揃い',                                            'cat-autumn',  () => true],
    gift:    ['ギフト',           '贈りものに選ばれているもの',                                                 'cat-gift',    () => true],
    care:    ['ケアアイテム',     '長く着るための道具',                                                         'cat-care',    () => true],
  };
  let filterFn = null;
  if (c && CAT[c]) {
    const [name, desc, img, fn] = CAT[c];
    $('[data-cat-name]').textContent = name;
    $('[data-cat-desc]').innerHTML = desc;
    $('[data-crumb]').textContent = name;
    const hero = $('[data-cat-hero]');
    if (hero) hero.src = `assets/img/photos/${img}.jpg`;
    document.title = name + '｜LADENNE.';
    filterFn = fn;
  }
  if (q) {
    $('[data-cat-name]').textContent = `「${q}」の検索結果`;
    $('[data-cat-desc]').textContent = '';
    $('[data-crumb]').textContent = '検索結果';
  }

  const show = el => { el.style.display = ''; };
  const hide = el => { el.style.display = 'none'; };
  const apply = () => {
    let n = 0;
    cards.forEach(card => {
      const name = card.querySelector('.pcard__name').textContent;
      let ok = true;
      if (q) ok = name.includes(q);
      if (ok && filterFn) {
        const meta = {cat: card.dataset.cat, sub2: card.dataset.sub2, tags: (card.dataset.tags || '').split(' ')};
        ok = filterFn(meta);
      }
      ok ? (show(card), n++) : hide(card);
    });
    $('[data-count]').textContent = n;
  };
  apply();

  // 並び替え
  $$('input[name="sort"]').forEach(r => r.addEventListener('change', () => {
    const v = r.value;
    const price = el => Number(el.querySelector('.pcard__price').textContent.replace(/[^\d]/g, ''));
    const list = cards.slice();
    if (v === '価格の安い順') list.sort((a, b) => price(a) - price(b));
    else if (v === '価格の高い順') list.sort((a, b) => price(b) - price(a));
    else if (v === '新着順') list.sort((a, b) => (b.querySelector('.badge') ? 1 : 0) - (a.querySelector('.badge') ? 1 : 0));
    list.forEach(el => grid.appendChild(el));
    $$('[data-fdrop]').forEach(d => d.classList.remove('is-open'));
  }));

  // 列数切り替え
  $$('[data-view] button').forEach(b => b.addEventListener('click', () => {
    $$('[data-view] button').forEach(x => x.classList.toggle('is-on', x === b));
    grid.style.gridTemplateColumns = b.dataset.cols === '3'
      ? 'repeat(3,1fr)'
      : (matchMedia('(max-width:767px)').matches ? 'repeat(2,1fr)' : 'repeat(5,1fr)');
  }));
})();

/* ---------------- フォーム（未接続） ---------------- */
$$('[data-newsletter], [data-contact]').forEach(f => f.addEventListener('submit', e => {
  e.preventDefault();
  alert('送信先はまだ接続していません。\n本番では配信サービス／フォーム送信先を設定します。');
}));

})();
