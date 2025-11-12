import { Form, useLoaderData, redirect, useNavigate } from "react-router-dom";
import {
  CONTACT_CATEGORY_OPTIONS,
  DEFAULT_CATEGORY,
  updateContact,
} from "../contacts";

export async function action({ request, params }) {
  const formData = await request.formData();
  const formEntries = Array.from(formData.entries());

  const updates = formEntries.reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});

  await updateContact(params.contactId, updates);
  return redirect(`/contacts/${params.contactId}`);
}

export default function EditContact() {
  const { contact } = useLoaderData();
  const navigate = useNavigate();
  const categoryValue = contact.category ?? DEFAULT_CATEGORY;
  const tagsValue = (contact.tags ?? []).join(", ");

  return (
    <Form method="post" id="contact-form">
      <p>
        <span>Name</span>
        <input
          placeholder="First"
          aria-label="First name"
          type="text"
          name="first"
          defaultValue={contact.first}
        />
        <input
          placeholder="Last"
          aria-label="Last name"
          type="text"
          name="last"
          defaultValue={contact?.last}
        />
      </p>
      <label>
        <span>Company</span>
        <input
          type="text"
          name="company"
          placeholder="Company or team"
          defaultValue={contact?.company}
        />
      </label>
      <label>
        <span>Location</span>
        <input
          type="text"
          name="location"
          placeholder="City, Country"
          defaultValue={contact?.location}
        />
      </label>
      <label>
        <span>Email</span>
        <input
          type="email"
          name="email"
          placeholder="you@example.com"
          defaultValue={contact?.email}
        />
      </label>
      <label>
        <span>Phone</span>
        <input
          type="tel"
          name="phone"
          placeholder="+84 90 123 4567"
          defaultValue={contact?.phone}
        />
      </label>
      <label>
        <span>Twitter</span>
        <input
          type="text"
          name="twitter"
          placeholder="@username"
          defaultValue={contact?.twitter ? `@${contact.twitter}` : ""}
        />
      </label>
      <label>
        <span>Avatar URL</span>
        <input
          placeholder="https://example.com/avatar.jpg"
          aria-label="Avatar URL"
          type="text"
          name="avatar"
          defaultValue={contact?.avatar}
        />
      </label>
      <label>
        <span>Category</span>
        <select name="category" defaultValue={categoryValue}>
          <option value="all">All categories</option>
          {CONTACT_CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Tags</span>
        <input
          type="text"
          name="tags"
          placeholder="react, design"
          defaultValue={tagsValue}
        />
      </label>
      <label>
        <span>Notes</span>
        <textarea name="notes" defaultValue={contact?.notes} rows={6} />
      </label>
      <label className="favorite-toggle">
        <input type="hidden" name="favorite" value="false" />
        <input
          type="checkbox"
          name="favorite"
          value="true"
          defaultChecked={contact.favorite}
        />
        <span>Mark as favorite</span>
      </label>
      <p>
        <button type="submit">Save</button>
        <button
          type="button"
          onClick={() => {
            navigate(-1);
          }}
        >
          Cancel
        </button>
      </p>
    </Form>
  );
}
