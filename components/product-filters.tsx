import Link from "next/link";

interface ProductFiltersProps {
  searchParams: { q?: string; category?: string };
}

export default function ProductFilters({ searchParams, categories }: ProductFiltersProps) {
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
          {Array.isArray(categories) && categories.length > 0 ? (
            categories.slice(0, 10).map((c: any) => {
              const name = (c.name && Object.values(c.name)[0]) || c.key || 'Category';
              return (
                <option value={c.id}>{name}</option>
              );
            })
          ) : (
            <></>
          )}
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
