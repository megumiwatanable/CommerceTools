interface ProductFiltersProps {
  searchParams: { q?: string; category?: string | string[] };
  categories: Array<{
    id: string;
    key?: string;
    name?: Record<string, string>;
    parent?: { id: string };
  }>;
  action?: string;
}

const nameOf = (category: ProductFiltersProps["categories"][number]) =>
  Object.values(category.name ?? {})[0] || category.key || "Category";

export default function ProductFilters({
  searchParams,
  categories,
  action = "/products",
}: ProductFiltersProps) {
  const selected = new Set(
    Array.isArray(searchParams.category)
      ? searchParams.category
      : searchParams.category
        ? [searchParams.category]
        : [],
  );
  const roots = categories.filter((category) => !category.parent);
  const childrenFor = (parentId: string) =>
    categories.filter((category) => category.parent?.id === parentId);
  const selectedCategory = (
    category: ProductFiltersProps["categories"][number],
  ) =>
    selected.has(category.id) ||
    Boolean(category.key && selected.has(category.key));
  const field = (
    category: ProductFiltersProps["categories"][number],
    child = false,
  ) => {
    const isSelected = selectedCategory(category);
    return (
      <label
        className={`category-check ${child ? "category-check-child" : ""} ${isSelected ? "is-selected" : ""}`}
        key={`${category.id}-${isSelected}`}
      >
        <input
          type="checkbox"
          name="category"
          value={category.id}
          defaultChecked={isSelected}
        />{" "}
        <span>{nameOf(category)}</span>
      </label>
    );
  };
  return (
    <form action={action} method="get" className="filter-panel">
      <p className="eyebrow">Refine results</p>
      <h2>Filters</h2>
      <div className="filter-group">
        <label htmlFor="q">Search</label>
        <input
          className="input"
          id="q"
          name="q"
          defaultValue={searchParams.q || ""}
          placeholder="Search products"
        />
      </div>
      <fieldset className="category-filter">
        <legend>Categories</legend>
        <label
          className={`category-check ${selected.size === 0 ? "is-selected" : ""}`}
          key={`all-${selected.size === 0}`}
        >
          <input
            type="checkbox"
            name="category"
            value=""
            defaultChecked={selected.size === 0}
          />{" "}
          <span>All categories</span>
        </label>
        {roots.map((category) => (
          <div className="category-check-group" key={category.id}>
            {field(category)}
            {childrenFor(category.id).map((child) => field(child, true))}
          </div>
        ))}
      </fieldset>
      <div>
        <button className="button" type="submit">
          Apply filters
        </button>
      </div>
    </form>
  );
}
