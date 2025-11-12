/* eslint-disable react-refresh/only-export-components */
import { useMemo } from "react";
import { Form, useLoaderData, useFetcher } from "react-router-dom";

import {
  CONTACT_CATEGORY_OPTIONS,
  DEFAULT_CATEGORY,
  getContact,
  updateContact,
} from "../contacts";

export async function loader({ params }) {
  const contact = await getContact(params.contactId);
  if (!contact) {
    throw new Response("", {
      status: 404,
      statusText: "Not Found",
    });
  }
  return { contact };
}

export async function action({ request, params }) {
  const formData = await request.formData();
  return updateContact(params.contactId, {
    favorite: formData.get("favorite") === "true",
  });
}

export default function Contact() {
  const { contact } = useLoaderData();
  const categoryLabelMap = useMemo(() => {
    return CONTACT_CATEGORY_OPTIONS.reduce(
      (acc, option) => {
        acc[option.value] = option.label;
        return acc;
      },
      { [DEFAULT_CATEGORY]: "Uncategorized" }
    );
  }, []);
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    []
  );
  const createdAt = contact.createdAt ? new Date(contact.createdAt) : null;
  const categoryLabel =
    categoryLabelMap[contact.category ?? DEFAULT_CATEGORY];
  const avatarUrl =
    contact.avatar || `https://robohash.org/${contact.id}.png?size=200x200`;
  const hasQuickLinks =
    contact.email || contact.phone || contact.twitter || contact.location;

  return (
    <div id="contact">
      <div className="contact-avatar">
        <img key={avatarUrl} src={avatarUrl} alt="Contact avatar" />
      </div>

      <div className="contact-details">
        <h1>
          {contact.first || contact.last ? (
            <>
              {contact.first} {contact.last}
            </>
          ) : (
            <i>No Name</i>
          )}
          <Favorite contact={contact} />
        </h1>

        <div className="contact-overview">
          {contact.company && (
            <span className="contact-company">{contact.company}</span>
          )}
          <span className="contact-category">{categoryLabel}</span>
        </div>

        {hasQuickLinks && (
          <ul className="contact-quick-links">
            {contact.email && (
              <li>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </li>
            )}
            {contact.phone && (
              <li>
                <a href={`tel:${contact.phone}`}>{contact.phone}</a>
              </li>
            )}
            {contact.twitter && (
              <li>
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={`https://twitter.com/${contact.twitter}`}
                >
                  @{contact.twitter}
                </a>
              </li>
            )}
            {contact.location && <li>{contact.location}</li>}
          </ul>
        )}

        {contact.notes && (
          <section className="contact-notes">
            <h2>Notes</h2>
            <p>{contact.notes}</p>
          </section>
        )}

        {(contact.tags ?? []).length > 0 && (
          <div className="contact-tags">
            {(contact.tags ?? []).map((tag) => (
              <span key={tag} className="tag-chip">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {createdAt && (
          <p className="contact-created-at">
            Added on {dateFormatter.format(createdAt)}
          </p>
        )}

        <div className="contact-actions">
          <Form action="edit">
            <button type="submit">Edit</button>
          </Form>
          <Form
            method="post"
            action="destroy"
            onSubmit={(event) => {
              if (!confirm("Please confirm you want to delete this record.")) {
                event.preventDefault();
              }
            }}
          >
            <button type="submit">Delete</button>
          </Form>
        </div>
      </div>
    </div>
  );
}

function Favorite({ contact }) {
  const fetcher = useFetcher();

  const favorite = fetcher.formData
    ? fetcher.formData.get("favorite") === "true"
    : contact.favorite;

  return (
    <fetcher.Form method="post">
      <button
        name="favorite"
        value={favorite ? "false" : "true"}
        aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
      >
        {favorite ? "★" : "☆"}
      </button>
    </fetcher.Form>
  );
}
