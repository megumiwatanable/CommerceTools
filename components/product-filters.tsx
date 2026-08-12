interface ProductFiltersProps {
  searchParams: { q?: string; category?: string };
}

export default function ProductFilters({ searchParams }: ProductFiltersProps) {
  return (
    <form action="/products" method="get" className="filter-panel">
      <div className="filter-group">
        <label htmlFor="q">Search</label>
        <input className="input" id="q" name="q" defaultValue={searchParams.q || ''} placeholder="Search products" />
      </div>
      <div className="filter-group">
        <label htmlFor="category">Category</label>
        <select className="select" id="category" name="category" defaultValue={searchParams.category || ''}>
          <option value="">All</option>
          <option value="clothing">Clothing</option>
          <option value="shoes">Shoes</option>
          <option value="accessories">Accessories</option>
        </select>
      </div>
      <div>
        <button className="button" type="submit">
          Filter
        </button>
      </div>
    </form>
  );
}
