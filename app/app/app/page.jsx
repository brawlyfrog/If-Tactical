"use client";
import React, { useMemo, useState } from "react";

const PRODUCTS = [
  { id: "bag-alpha", name: "Go-Bag Alpha", price: 349.0, category: "Go-Bags", rating: 4.8, inStock: true, icon: "📦", desc: "Flagship 24-hour deployment pack with hydration, trauma, multitool, paracord, and modular pouches.", tags: ["mission-ready","water-resistant","modular"] },
  { id: "bag-bravo", name: "Urban Response Pack Bravo", price: 289.0, category: "Go-Bags", rating: 4.6, inStock: true, icon: "🛟", desc: "Compact city survival kit with trauma essentials, portable power bank, and mask/filtration module.", tags: ["compact","trauma","urban"] },
  { id: "med-station", name: "MedStation Rapid Kit", price: 599.0, category: "Medical", rating: 4.7, inStock: true, icon: "🛡️", desc: "Stabilization kit for first 8–10 hours: airway management, bleed control, shock stabilization.", tags: ["IFAK","ALS","stabilization"] },
  { id: "ifak-lite", name: "IFAK Lite", price: 149.0, category: "Medical", rating: 4.5, inStock: true, icon: "🛡️", desc: "Individual First Aid Kit with tourniquet, gauze, chest seals, burn gel. Compact and ready for EDC.", tags: ["first-aid","compact","EDC"] },
  { id: "comms-starlink", name: "Field Comms Node (Starlink-Ready)", price: 1299.0, category: "Comms", rating: 4.9, inStock: true, icon: "📻", desc: "Rugged comms hub with VHF/UHF integration, 12/24V power distribution, weatherproof housing.", tags: ["comms","starlink","rugged"] },
  { id: "signal-pouch", name: "Signal Pouch Add-On", price: 89.0, category: "Comms", rating: 4.3, inStock: true, icon: "📻", desc: "Faraday-shielded pouch for radios with antenna passthrough. Protects from interference.", tags: ["comms","shielded","addon"] },
  { id: "apparel-tee", name: "IF Tactical Navy Tee", price: 28.0, category: "Apparel", rating: 4.5, inStock: true, icon: "🏷️", desc: "Premium cotton tee with subdued IF Tactical badge. Navy blue, veteran-owned stamp inside collar.", tags: ["apparel","cotton","veteran"] },
  { id: "morale-patch", name: "Morale Patch Set (3-Pack)", price: 18.0, category: "Apparel", rating: 4.4, inStock: true, icon: "🏷️", desc: "Hook-and-loop patch set: Mission Ready / Veteran Owned / IF Tactical Badge.", tags: ["patch","velcro","set"] },
  { id: "tactical-cap", name: "Tactical Cap (Navy)", price: 32.0, category: "Apparel", rating: 4.6, inStock: true, icon: "🏷️", desc: "Low-profile breathable cap with subdued embroidered badge and patch area.", tags: ["cap","navy","gear"] },
];

const CATEGORIES = ["All","Go-Bags","Medical","Comms","Apparel"];
const fmt = (n) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n);
const Stars = ({v}) => (
  <span className="text-sm">
    {Array.from({length:5}).map((_,i)=><span key={i}>{i<Math.round(v)?"★":"☆"}</span>)}
    <span className="ml-1 text-slate-500">{v.toFixed(1)}</span>
  </span>
);

export default function Page(){
  const [query,setQuery]=useState("");
  const [category,setCategory]=useState("All");
  const [sort,setSort]=useState("featured");
  const [cart,setCart]=useState({}); // { [id]: qty }

  const filtered = useMemo(()=> {
    let out = PRODUCTS.filter(p=>p.inStock);
    if(category!=="All") out = out.filter(p=>p.category===category);
    if(query.trim()){
      const q=query.toLowerCase();
      out = out.filter(p=> p.name.toLowerCase().includes(q)||p.desc.toLowerCase().includes(q)||p.tags.join(" ").toLowerCase().includes(q));
    }
    if(sort==="price-asc") out.sort((a,b)=>a.price-b.price);
    if(sort==="price-desc") out.sort((a,b)=>b.price-a.price);
    if(sort==="rating") out.sort((a,b)=>b.rating-a.rating);
    return out;
  },[query,category,sort]);

  const items = Object.entries(cart).map(([id,qty])=>({product:PRODUCTS.find(p=>p.id===id),qty}));
  const subtotal = items.reduce((s,{product,qty})=> s+product.price*qty, 0);

  function add(id){ setCart(p=>({...p,[id]:(p[id]||0)+1})); }
  function remove(id){ setCart(p=>{ const n={...p}; delete n[id]; return n; }); }

  async function checkout(){
    if(items.length===0){ alert("Your cart is empty."); return; }
    const payload = {
      items: items.map(({product,qty})=>({
        name: product.name,
        price: product.price,
        quantity: qty
      })),
      success_url: `${window.location.origin}/?status=success`,
      cancel_url: `${window.location.origin}/?status=cancelled`
    };
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if(res.ok && data?.url){ window.location.href = data.url; }
      else { alert(`Checkout error: ${data?.detail || data?.error || "Unknown"}`); }
    } catch (e) {
      alert(`Checkout request failed: ${e?.message || e}`);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <span className="font-bold tracking-tight">IF Tactical</span>
            <span className="ml-2 inline-flex items-center px-2 py-1 text-xs rounded bg-slate-900 text-white">Veteran-Owned</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 border rounded-xl px-2">
              <span>🔎</span>
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search gear…" className="border-0 outline-none py-2 bg-transparent"/>
            </div>
            <select value={category} onChange={e=>setCategory(e.target.value)} className="border bg-white px-3 py-2 rounded-md">
              {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <select value={sort} onChange={e=>setSort(e.target.value)} className="border bg-white px-3 py-2 rounded-md">
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Rating</option>
            </select>
            <button className="border bg-white px-3 py-2 rounded-2xl flex items-center">🛒 Cart ({items.reduce((s,i)=>s+i.qty,0)})</button>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">Mission-ready gear for real-world chaos.</h1>
            <p className="mt-3 text-slate-200">Veteran-owned, Texas-built. Designed to perform when it matters most.</p>
            <div className="mt-6 flex gap-3">
              <a href="#catalog" className="px-4 py-2 rounded-2xl bg-white text-slate-900 font-medium">Shop Catalog</a>
              <span className="px-4 py-2 rounded-2xl border inline-flex items-center">🚚 Free US shipping $99+</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {PRODUCTS.slice(0,4).map(p=>(
              <div key={p.id} className="rounded-2xl border border-white/10 bg-white/5 text-white p-4">
                <div className="text-base font-semibold flex items-center gap-2"><span>{p.icon}</span>{p.name}</div>
                <div className="text-sm text-slate-300 mt-2">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="catalog" className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-4 flex items-center gap-2 text-slate-600">⛯ Refine results</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(p=>(
            <div key={p.id} className="rounded-2xl border bg-white p-5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{p.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold leading-tight">{p.name}</div>
                  <Stars v={p.rating}/>
                  <div className="mt-1 text-sm text-slate-500">{p.desc}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-lg font-bold">{fmt(p.price)}</div>
                <button onClick={()=>add(p.id)} className="px-4 py-2 rounded-2xl bg-slate-900 text-white">Add to cart</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="sticky bottom-4">
        <div className="mx-auto max-w-6xl px-4">
          <div className="rounded-2xl border bg-white p-4 flex items-center justify-between shadow">
            <div className="text-sm text-slate-600">
              Items: <strong>{items.reduce((s,i)=>s+i.qty,0)}</strong> • Subtotal: <strong>{fmt(subtotal)}</strong>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>setCart({})} className="px-4 py-2 rounded-2xl border">Clear</button>
              <button onClick={checkout} className="px-4 py-2 rounded-2xl bg-slate-900 text-white">Checkout</button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t bg-white mt-10">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-600 grid md:grid-cols-3 gap-6">
          <div><div className="font-semibold">IF Tactical</div><div>Veteran-owned & operated • Killeen, Texas</div></div>
          <div>
            <div className="font-semibold">Policies</div>
            <ul className="mt-2 space-y-1">
              <li>Shipping & Returns</li><li>Warranty</li><li>Privacy</li>
            </ul>
          </div>
          <div><div className="font-semibold">Contact</div><div>info@iftactical.com</div></div>
        </div>
      </footer>
    </div>
  );
}
