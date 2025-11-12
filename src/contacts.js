import localforage from "localforage";
import { matchSorter } from "match-sorter";
import sortBy from "sort-by";

export const DEFAULT_CATEGORY = "uncategorized";

export const CONTACT_CATEGORY_OPTIONS = [
  { value: "work", label: "Work" },
  { value: "family", label: "Family" },
  { value: "friends", label: "Friends" },
  { value: "services", label: "Services" },
  { value: "vip", label: "VIP" },
  { value: "community", label: "Community" },
  { value: DEFAULT_CATEGORY, label: "Uncategorized" },
];

const SAMPLE_CONTACTS = createSampleContacts();

export async function getContacts(options) {
  const normalized = normalizeContactQuery(options);
  await fakeNetwork(`getContacts:${JSON.stringify(normalized)}`);

  let contacts = await ensureContactsSeeded();
  let result = [...contacts];

  if (normalized.q) {
    result = matchSorter(result, normalized.q, {
      keys: ["first", "last", "company", "email", "tags"],
    });
  }

  if (normalized.favoriteOnly) {
    result = result.filter((contact) => contact.favorite);
  }

  if (normalized.category && normalized.category !== "all") {
    result = result.filter(
      (contact) =>
        contact.category &&
        contact.category.toLowerCase() === normalized.category.toLowerCase()
    );
  }

  if (normalized.tag) {
    const tagNeedle = normalized.tag.toLowerCase();
    result = result.filter((contact) =>
      (contact.tags ?? []).some((tag) => tag.toLowerCase().includes(tagNeedle))
    );
  }

  sortContacts(result, normalized.sortBy);

  return result;
}

export async function getAllContacts() {
  await fakeNetwork("getContacts:all");
  const contacts = await ensureContactsSeeded();
  return [...contacts];
}

export async function createContact() {
  await fakeNetwork();
  const id = Math.random().toString(36).substring(2, 9);
  const contact = normalizeContactForStorage({
    id,
    createdAt: Date.now(),
    first: "",
    last: "",
    twitter: "",
    avatar: "",
    notes: "",
    favorite: false,
    email: "",
    phone: "",
    company: "",
    category: DEFAULT_CATEGORY,
    tags: [],
    location: "",
  });

  const contacts = await ensureContactsSeeded();
  contacts.unshift(contact);
  await set(contacts);
  return contact;
}

export async function getContact(id) {
  await fakeNetwork(`contact:${id}`);
  const contacts = await ensureContactsSeeded();
  const contact = contacts.find((entry) => entry.id === id);
  return contact ?? null;
}

export async function updateContact(id, updates) {
  await fakeNetwork();
  const contacts = await ensureContactsSeeded();
  const contact = contacts.find((entry) => entry.id === id);
  if (!contact) throw new Error(`No contact found for ${id}`);

  const normalizedUpdates = normalizeContactForStorage(updates);
  Object.assign(contact, normalizedUpdates);
  await set(contacts);
  return contact;
}

export async function deleteContact(id) {
  const contacts = await ensureContactsSeeded();
  const index = contacts.findIndex((entry) => entry.id === id);
  if (index > -1) {
    contacts.splice(index, 1);
    await set(contacts);
    return true;
  }
  return false;
}

function sortContacts(contacts, sortByOption) {
  switch (sortByOption) {
    case "first":
      contacts.sort(sortBy("first", "last"));
      break;
    case "company":
      contacts.sort(
        sortBy(
          (item) => item.company?.toLowerCase() || "",
          "last",
          "first"
        )
      );
      break;
    case "recent":
      contacts.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      break;
    case "favorite":
      contacts.sort((a, b) => {
        if (a.favorite === b.favorite) {
          return (a.last || "").localeCompare(b.last || "", undefined, {
            sensitivity: "base",
          });
        }
        return a.favorite ? -1 : 1;
      });
      break;
    case "last":
    default:
      contacts.sort(sortBy("last", "first"));
      break;
  }
}

function normalizeContactQuery(options) {
  if (!options) return { sortBy: "last" };
  if (typeof options === "string") {
    return { q: options, sortBy: "last" };
  }

  const normalized = { ...options };
  const q = normalized.q ?? normalized.query ?? "";
  const favoriteOnly =
    normalized.favoriteOnly ??
    normalized.onlyFavorites ??
    normalized.favorite ??
    false;
  const category = normalized.category ?? normalized.categoryFilter ?? "";
  const sortByOption = normalized.sortBy ?? normalized.sort ?? "last";
  const tag = normalized.tag ?? normalized.tagFilter ?? "";

  return {
    q: q ? String(q) : "",
    favoriteOnly:
      favoriteOnly === true ||
      favoriteOnly === "true" ||
      favoriteOnly === "1",
    category: category ? String(category) : "",
    sortBy: String(sortByOption),
    tag: tag ? String(tag) : "",
  };
}

function normalizeContactForStorage(payload) {
  const normalized = { ...payload };

  if (normalized.twitter) {
    normalized.twitter = String(normalized.twitter).replace(/^@+/, "").trim();
  }

  if (normalized.email) {
    normalized.email = String(normalized.email).trim();
  }

  if (normalized.phone) {
    normalized.phone = String(normalized.phone).trim();
  }

  if (normalized.category === "all" || !normalized.category) {
    normalized.category = DEFAULT_CATEGORY;
  }

  if (normalized.favorite !== undefined) {
    normalized.favorite =
      normalized.favorite === true ||
      normalized.favorite === "true" ||
      normalized.favorite === "1";
  }

  if (normalized.tags !== undefined) {
    if (Array.isArray(normalized.tags)) {
      normalized.tags = normalized.tags
        .map((tag) => String(tag).trim())
        .filter(Boolean);
    } else if (typeof normalized.tags === "string") {
      normalized.tags = normalized.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    }
  }

  if (normalized.notes) {
    normalized.notes = String(normalized.notes).trim();
  }

  return normalized;
}

async function ensureContactsSeeded() {
  let contacts = await localforage.getItem("contacts");
  if (!Array.isArray(contacts) || contacts.length === 0) {
    contacts = SAMPLE_CONTACTS.map((contact) => ({ ...contact }));
    await set(contacts);
  }
  return contacts;
}

function set(contacts) {
  return localforage.setItem("contacts", contacts);
}

// fake a cache so we don't slow down stuff we've already seen
let fakeCache = {};

async function fakeNetwork(key) {
  if (!key) {
    fakeCache = {};
  }

  if (fakeCache[key]) {
    return;
  }

  fakeCache[key] = true;
  return new Promise((res) => {
    setTimeout(res, Math.random() * 800);
  });
}

function createSampleContacts() {
  const now = Date.now();
  const samples = [
    {
      id: "seed-ava-nguyen",
      first: "Ava",
      last: "Nguyen",
      avatar: "https://avatar.iran.liara.run/public/2",
      twitter: "ava_codes",
      email: "ava.nguyen@example.com",
      phone: "+84 90 123 4567",
      company: "Pixel Forge",
      category: "work",
      favorite: true,
      tags: ["design", "ux", "mentor"],
      location: "Ho Chi Minh City, VN",
      notes:
        "Product designer leading our new dashboard modernization effort. Loves quick feedback cycles.",
    },
    {
      id: "seed-leo-phan",
      first: "Leo",
      last: "Phan",
      avatar: "https://avatar.iran.liara.run/public/job/doctor/female",
      twitter: "drleophan",
      email: "leo.phan@mediplus.vn",
      phone: "+84 28 3824 8888",
      company: "MediPlus Clinic",
      category: "services",
      favorite: false,
      tags: ["health", "family"],
      location: "District 3, HCMC",
      notes:
        "Family doctor — reminder to send updated insurance card before the next visit.",
    },
    {
      id: "seed-minh-vo",
      first: "Minh",
      last: "Vo",
      avatar: "https://avatar.iran.liara.run/public/job/designer/male",
      twitter: "minhvo_dev",
      email: "minh.vo@stellar.app",
      phone: "+1 415 555 0110",
      company: "Stellar Apps",
      category: "friends",
      favorite: true,
      tags: ["react", "speaker"],
      location: "San Francisco, USA",
      notes:
        "Frontend lead at Stellar. Co-speaker for React Summit panel. Prefers async communication.",
    },
    {
      id: "seed-chi-nguyen",
      first: "Chi",
      last: "Nguyen",
      avatar: "https://avatar.iran.liara.run/public/job/operator/female",
      twitter: "chi_calls",
      email: "chi.nguyen@helpline.vn",
      phone: "+84 28 7100 8899",
      company: "Helpline VN",
      category: "community",
      favorite: false,
      tags: ["volunteer", "support"],
      location: "Can Tho, VN",
      notes:
        "Coordinates the weekend volunteer hotline. Share monthly metrics by the 5th.",
    },
    {
      id: "seed-khang-le",
      first: "Khang",
      last: "Le",
      avatar: "https://avatar.iran.liara.run/public/job/teacher/male",
      twitter: "teacherkhang",
      email: "khang.le@brightfuture.edu",
      phone: "+84 24 3773 2666",
      company: "Bright Future Academy",
      category: "family",
      favorite: false,
      tags: ["education"],
      location: "Hanoi, VN",
      notes:
        "Mai's homeroom teacher. Schedule parent conference during the first week of next semester.",
    },
    {
      id: "seed-ella-vo",
      first: "Ella",
      last: "Vo",
      avatar: "https://avatar.iran.liara.run/public/job/astronomer/male",
      twitter: "ella_in_space",
      email: "ella.vo@astro-labs.org",
      phone: "+44 20 7946 0958",
      company: "Astro Labs",
      category: "vip",
      favorite: true,
      tags: ["investor", "science"],
      location: "London, UK",
      notes:
        "Key advisor for the STEM scholarship fund. Visiting Vietnam in December — plan meetup.",
    },
  ];

  return samples.map((contact, index) => ({
    ...contact,
    createdAt: now - index * 1000 * 60 * 60 * 24,
  }));
}