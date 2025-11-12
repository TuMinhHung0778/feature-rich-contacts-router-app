import { useEffect, useMemo } from "react";
import {
  Outlet,
  NavLink,
  useLoaderData,
  Form,
  redirect,
  useNavigation,
  useSubmit,
} from "react-router-dom";
import {
  CONTACT_CATEGORY_OPTIONS,
  DEFAULT_CATEGORY,
  createContact,
  getAllContacts,
  getContacts,
} from "../contacts";

export async function loader({ request }) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const favorite = url.searchParams.get("favorite") ?? "";
  const category = url.searchParams.get("category") ?? "all";
  const sort = url.searchParams.get("sort") ?? "last";
  const tag = url.searchParams.get("tag") ?? "";

  const contacts = await getContacts({
    q,
    favoriteOnly: favorite === "true",
    category,
    sortBy: sort,
    tag,
  });

  const allContacts = await getAllContacts();

  return {
    contacts,
    filters: {
      q,
      favorite: favorite === "true",
      category,
      sort,
      tag,
    },
    allContacts,
  };
}

export async function action() {
  const contact = await createContact();
  return redirect(`/contacts/${contact.id}/edit`);
}

export default function Root() {
  const { contacts, filters, allContacts } = useLoaderData();
  const navigation = useNavigation();
  const submit = useSubmit();

  const searching =
    navigation.location &&
    new URLSearchParams(navigation.location.search).has("q");

  useEffect(() => {
    const searchInput = document.getElementById("q");
    const favoriteCheckbox = document.getElementById("favorite-filter");
    const categorySelect = document.getElementById("category-filter");
    const sortSelect = document.getElementById("sort-order");
    const tagInput = document.getElementById("tag-filter");

    if (searchInput) searchInput.value = filters.q ?? "";
    if (favoriteCheckbox) favoriteCheckbox.checked = Boolean(filters.favorite);
    if (categorySelect) categorySelect.value = filters.category ?? "all";
    if (sortSelect) sortSelect.value = filters.sort ?? "last";
    if (tagInput) tagInput.value = filters.tag ?? "";
  }, [filters]);

  const categoryLabelMap = useMemo(() => {
    return CONTACT_CATEGORY_OPTIONS.reduce(
      (acc, option) => {
        acc[option.value] = option.label;
        return acc;
      },
      { [DEFAULT_CATEGORY]: "Uncategorized" }
    );
  }, []);

  const stats = useMemo(() => {
    const total = allContacts.length;
    const favorites = allContacts.filter((contact) => contact.favorite).length;
    const categoryCounts = allContacts.reduce((acc, contact) => {
      const key = contact.category || DEFAULT_CATEGORY;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const topCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([value, count]) => ({
        value,
        label: categoryLabelMap[value] ?? categoryLabelMap[DEFAULT_CATEGORY],
        count,
      }));

    return { total, favorites, topCategories };
  }, [allContacts, categoryLabelMap]);

  function handleInstantSubmit(form, opts = {}) {
    submit(form, { replace: true, ...opts });
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(allContacts, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "contacts-export.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div id="sidebar">
        <h1>Minh Hưng - Practice project about react-router</h1>

        <div className="sidebar-actions">
          <Form id="search-form" role="search" className="filter-form">
            <input
              id="q"
              className={searching ? "loading" : ""}
              aria-label="Search contacts"
              placeholder="Search"
              type="search"
              name="q"
              defaultValue={filters.q}
              onChange={(event) => {
                const form = event.currentTarget.form;
                const isFirstSearch = !filters.q;
                handleInstantSubmit(form, { replace: !isFirstSearch ? true : false });
              }}
            />
            <div id="search-spinner" aria-hidden hidden={!searching} />
            <div className="filter-grid">
              <label className="filter-checkbox">
                <input
                  id="favorite-filter"
                  type="checkbox"
                  name="favorite"
                  value="true"
                  defaultChecked={filters.favorite}
                  onChange={(event) => {
                    handleInstantSubmit(event.currentTarget.form);
                  }}
                />
                <span>Favorites only</span>
              </label>
              <label className="filter-select">
                <span className="sr-only">Filter by category</span>
                <select
                  id="category-filter"
                  name="category"
                  defaultValue={filters.category}
                  onChange={(event) => handleInstantSubmit(event.currentTarget.form)}
                >
                  <option value="all">All categories</option>
                  {CONTACT_CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="filter-input">
                <input
                  id="tag-filter"
                  type="text"
                  name="tag"
                  placeholder="Tag filter (e.g. react)"
                  defaultValue={filters.tag}
                  onChange={(event) => {
                    handleInstantSubmit(event.currentTarget.form);
                  }}
                />
              </label>
              <label className="filter-select">
                <span className="sr-only">Sort contacts</span>
                <select
                  id="sort-order"
                  name="sort"
                  defaultValue={filters.sort}
                  onChange={(event) => handleInstantSubmit(event.currentTarget.form)}
                >
                  <option value="last">Last name</option>
                  <option value="first">First name</option>
                  <option value="company">Company</option>
                  <option value="recent">Recently added</option>
                  <option value="favorite">Favorite status</option>
                </select>
              </label>
            </div>
            <div className="sr-only" aria-live="polite"></div>
          </Form>
          <div className="sidebar-buttons">
            <Form method="post">
              <button type="submit">New</button>
            </Form>
            <button type="button" onClick={handleExport}>
              Export JSON
            </button>
          </div>
        </div>

        <div className="sidebar-summary">
          <div>
            <span className="summary-count">{stats.total}</span>
            <span className="summary-label">Total</span>
          </div>
          <div>
            <span className="summary-count">{stats.favorites}</span>
            <span className="summary-label">Favorites</span>
          </div>
          {stats.topCategories.map((categoryStat) => (
            <div key={categoryStat.value}>
              <span className="summary-count">{categoryStat.count}</span>
              <span className="summary-label">{categoryStat.label}</span>
            </div>
          ))}
        </div>

        <nav>
          {contacts.length ? (
            <ul>
              {contacts.map((contact) => {
                const contactLabel =
                  categoryLabelMap[contact.category ?? DEFAULT_CATEGORY];
                return (
                  <li key={contact.id}>
                    <NavLink
                      to={`contacts/${contact.id}`}
                      className={({ isActive, isPending }) =>
                        isActive ? "active" : isPending ? "pending" : ""
                      }
                    >
                      <span className="contact-name">
                        {contact.first || contact.last ? (
                          <>
                            {contact.first} {contact.last}
                          </>
                        ) : (
                          <i>No Name</i>
                        )}
                        {contact.favorite && <span className="favorite-indicator">★</span>}
                      </span>
                      <span className="contact-meta">
                        {contact.company || contactLabel}
                      </span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>
              <i>No contacts</i>
            </p>
          )}
        </nav>
      </div>
      <div
        id="detail"
        className={navigation.state === "loading" ? "loading" : ""}
      >
        <Outlet />
      </div>
    </>
  );
}
