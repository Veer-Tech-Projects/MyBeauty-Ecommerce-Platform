import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import ProductCard from "@/modules/Product/components/ProductCard";

/* ── helpers ─────────────────────────────────────────── */
function useQuery() {
  return new URLSearchParams(useLocation().search);
}
const envBase = (import.meta.env.VITE_API_BASE_URL || '').trim();
const API_BASE = envBase ? envBase.replace(/\/$/, '') : 'http://localhost:5000';
/* ─────────────────────────────────────────────────────── */

export default function SearchResults() {
  const query = useQuery().get('q')?.trim() || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  /* fetch on query change */
  useEffect(() => {
    if (!query) { setResults([]); return; }

    setLoading(true);
    axios
      .get(`${API_BASE}/api/products/search?q=${encodeURIComponent(query)}`)
      .then(res => setResults(Array.isArray(res.data) ? res.data : []))
      .catch(err => { console.error('❌ search error:', err); setResults([]); })
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="container py-4">
      <h4 className="mb-3">
        Results for <strong>{query}</strong>{' '}
        {results.length > 0 && `(${results.length})`}
      </h4>

      {/* 🔄 global spinner */}
      {loading && (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border" role="status" />
        </div>
      )}

      {!loading && results.length === 0 && <p>No products found.</p>}

      {!loading && results.length > 0 && (
        <div className="row g-4">
          {results.map(p => (
            <div key={p.id} className="col-6 col-md-4 col-lg-3">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
