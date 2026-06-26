import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  smallint,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { table } from "console";

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
    type: varchar("type", { length: 10 }).notNull(), // 'movie'
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