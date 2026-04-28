import {
  pgTable,
  text,
  timestamp,
  real,
  jsonb,
  boolean,
  uuid,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const households = pgTable("households", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const householdMembers = pgTable(
  "household_members",
  {
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"), // owner | member
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.householdId, t.userId] }),
    index("household_members_user_idx").on(t.userId),
  ],
);

export const invites = pgTable("invites", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  invitedBy: uuid("invited_by").references(() => users.id),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const cats = pgTable(
  "cats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    breed: text("breed"),
    born: text("born"), // ISO date
    weightKg: real("weight_kg"),
    sex: text("sex"), // M | F
    neutered: boolean("neutered").default(false).notNull(),
    indoor: boolean("indoor").default(true).notNull(),
    color: text("color").default("oklch(72% 0.05 60)").notNull(),
    photoUrl: text("photo_url"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("cats_household_idx").on(t.householdId)],
);

// Custom activities per household (built-ins live in code).
export const customActivities = pgTable("custom_activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(), // unique within household
  label: text("label").notNull(),
  category: text("category").notNull(),
  emoji: text("emoji"),
  glyph: text("glyph"), // 2 letters for mono icon
  fields: jsonb("fields").$type<string[]>().default([]).notNull(),
  hidden: boolean("hidden").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Per-household visibility/order overrides for built-in activities.
export const activitySettings = pgTable(
  "activity_settings",
  {
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    activitySlug: text("activity_slug").notNull(),
    hidden: boolean("hidden").default(false).notNull(),
  },
  (t) => [primaryKey({ columns: [t.householdId, t.activitySlug] })],
);

export const logs = pgTable(
  "logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    householdId: uuid("household_id")
      .notNull()
      .references(() => households.id, { onDelete: "cascade" }),
    catId: uuid("cat_id")
      .notNull()
      .references(() => cats.id, { onDelete: "cascade" }),
    activitySlug: text("activity_slug").notNull(),
    happenedAt: timestamp("happened_at", { withTimezone: true }).notNull(),
    note: text("note"),
    data: jsonb("data").$type<Record<string, unknown>>().default({}).notNull(),
    photoUrl: text("photo_url"),
    fileUrl: text("file_url"),
    fileName: text("file_name"),
    createdById: uuid("created_by_id").references(() => users.id),
    createdByLabel: text("created_by_label"), // cached for display
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("logs_household_idx").on(t.householdId),
    index("logs_cat_idx").on(t.catId),
    index("logs_happened_idx").on(t.happenedAt),
  ],
);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // random token
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const magicLinks = pgTable("magic_links", {
  token: text("token").primaryKey(),
  email: text("email").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const mcpTokens = pgTable("mcp_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  householdId: uuid("household_id")
    .notNull()
    .references(() => households.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  label: text("label").default("default").notNull(),
  scope: text("scope").default("read_write").notNull(), // read | read_write
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
});

export const householdSettings = pgTable("household_settings", {
  householdId: uuid("household_id")
    .primaryKey()
    .references(() => households.id, { onDelete: "cascade" }),
  accent: text("accent").default("#5f4b21").notNull(),
  themeMode: text("theme_mode").default("auto").notNull(), // auto | light | dark
  density: text("density").default("regular").notNull(),
  iconStyle: text("icon_style").default("shape").notNull(),
});
