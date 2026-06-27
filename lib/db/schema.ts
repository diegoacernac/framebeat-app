import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  smallint,
  unique,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique(),
  username: varchar("username", { length: 30 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100} ),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mediaItems = pgTable(
  "media_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: varchar("type", { length: 10 }).notNull().$type<"movie" | "album">(),
    externalId: varchar("external_id", { length: 100 }).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    posterUrl: text("poster_url"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueExternal: unique().on(table.type, table.externalId),
  })
);

export const ratings = pgTable(
  "ratings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    mediaItemId: uuid("media_item_id")
      .notNull()
      .references(() => mediaItems.id),
    stars: smallint("stars").notNull(),
    review: text("review"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueUserMedia: unique().on(table.userId, table.mediaItemId),
  })
);

export const mediaItemsRelations = relations(mediaItems, ({ many }) => ({
  ratings: many(ratings),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  mediaItem: one(mediaItems, {
    fields:[ratings.mediaItemId],
    references:[mediaItems.id],
  }),
}));

export const sharedLists = pgTable("shared_lists", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const listMembers = pgTable(
  "list_members",
  {
    listId: uuid("list_id")
      .notNull()
      .references(() => sharedLists.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    role: varchar("role", { length: 10 })
      .notNull()
      .$type<"owner" | "member">(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.listId, table.userId] }),
  })
);

export const listItems = pgTable(
  "list_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listId: uuid("list_id")
      .notNull()
      .references(() => sharedLists.id, { onDelete: "cascade" }),
    mediaItemId: uuid("media_item_id")
      .notNull()
      .references(() => mediaItems.id),
    addedBy: uuid("added_by").notNull(),
    position: smallint("position").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueListMedia: unique().on(table.listId, table.mediaItemId),
  })
);
export const listItemProgress = pgTable(
  "list_item_progress",
  {
    listId: uuid("list_id")
      .notNull()
      .references(() => sharedLists.id, { onDelete: "cascade" }),
    mediaItemId: uuid("media_item_id")
      .notNull()
      .references(() => mediaItems.id),
    userId: uuid("user_id").notNull(),
    completedAt: timestamp("completed_at").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.listId, table.mediaItemId, table.userId],
    }),
  })
);
export const sharedListsRelations = relations(sharedLists, ({ many }) => ({
  members: many(listMembers),
  items: many(listItems),
}));
export const listMembersRelations = relations(listMembers, ({ one }) => ({
  list: one(sharedLists, {
    fields: [listMembers.listId],
    references: [sharedLists.id],
  }),
}));
export const listItemsRelations = relations(listItems, ({ one }) => ({
  list: one(sharedLists, {
    fields: [listItems.listId],
    references: [sharedLists.id],
  }),
  mediaItem: one(mediaItems, {
    fields: [listItems.mediaItemId],
    references: [mediaItems.id],
  }),
}));