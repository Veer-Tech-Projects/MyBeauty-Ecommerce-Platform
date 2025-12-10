import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/CategorySection.css';

import ImageWithLoader from './ImageWithLoader';

function CategorySection() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/products/categories')
      .then(res => res.json())
      .then(data => {
        // Ensure the data is an array
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          console.error('Unexpected categories response:', data);
          setCategories([]);
        }
      })
      .catch(err => {
        console.error('Error fetching categories:', err);
        setCategories([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="category-section">
      <h3 className="section-title">Shop by Category</h3>

      <div className="category-container">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="category-card placeholder-glow">
                <div className="category-img-wrapper placeholder" />
                <p className="placeholder col-8 mt-2" style={{ height: 12 }} />
              </div>
            ))
          : Array.isArray(categories) && categories.length > 0
            ? categories.map(category => (
                <Link
                  to={`/category/${category.id}`}
                  className="category-card text-decoration-none text-dark"
                  key={category.id}
                >
                  <div className="category-img-wrapper">
                    <ImageWithLoader
                      src={`http://localhost:5000${category.image || '/static/default-category.png'}`}
                      alt={category.name}
                      className="category-img"
                      style={{ minHeight: 50 }}
                    />
                  </div>
                  <div className="category-name">{category.name}</div>
                </Link>
              ))
            : !loading && (
                <p className="text-muted">No categories found.</p>
              )}
      </div>
    </div>
  );
}

export default CategorySection;
