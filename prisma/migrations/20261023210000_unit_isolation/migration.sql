-- REQ-27 / ADR 0036: every troop-data table gets a unitId, backfilled into
-- the one existing unit, then isolated three ways below the app: Row-Level
-- Security under a dedicated role, same-unit triggers on every reference
-- between rows, and a trigger that keeps a row's unit fixed for life.
-- Hand-ordered (not Prisma's generated order) so the backfill runs before
-- NOT NULL, the same style as ADR 0018's and ADR 0035's migrations.

-- ------------------------------------------------------------
-- 1. Columns, nullable while they're backfilled
-- ------------------------------------------------------------

ALTER TABLE "Patrol" ADD COLUMN "unitId" TEXT;
ALTER TABLE "Campout" ADD COLUMN "unitId" TEXT;
ALTER TABLE "CampoutUploadBatch" ADD COLUMN "unitId" TEXT;
ALTER TABLE "Menu" ADD COLUMN "unitId" TEXT;
ALTER TABLE "Meal" ADD COLUMN "unitId" TEXT;
ALTER TABLE "Dish" ADD COLUMN "unitId" TEXT;
ALTER TABLE "Ingredient" ADD COLUMN "unitId" TEXT;
ALTER TABLE "Review" ADD COLUMN "unitId" TEXT;
ALTER TABLE "Comment" ADD COLUMN "unitId" TEXT;
ALTER TABLE "CommentActivity" ADD COLUMN "unitId" TEXT;
ALTER TABLE "MealFrameworkException" ADD COLUMN "unitId" TEXT;

-- ------------------------------------------------------------
-- 2. Backfill (REQ-27.19): all existing data belongs to the one unit ADR
-- 0035's migration created. Refuses to guess if there isn't exactly one.
-- ------------------------------------------------------------

DO $$
DECLARE
  unit_count INTEGER;
  the_unit TEXT;
BEGIN
  SELECT count(*) INTO unit_count FROM "Unit";
  IF unit_count <> 1 THEN
    IF EXISTS (SELECT 1 FROM "Patrol") OR EXISTS (SELECT 1 FROM "Campout") OR EXISTS (SELECT 1 FROM "CampoutUploadBatch") THEN
      RAISE EXCEPTION 'unit isolation backfill expects exactly one Unit, found %', unit_count;
    END IF;
    RETURN;
  END IF;
  SELECT "id" INTO the_unit FROM "Unit";

  UPDATE "Patrol" SET "unitId" = the_unit;
  UPDATE "Campout" SET "unitId" = the_unit;
  UPDATE "CampoutUploadBatch" SET "unitId" = the_unit;
  UPDATE "Menu" SET "unitId" = the_unit;
  UPDATE "Meal" SET "unitId" = the_unit;
  UPDATE "Dish" SET "unitId" = the_unit;
  UPDATE "Ingredient" SET "unitId" = the_unit;
  UPDATE "Review" SET "unitId" = the_unit;
  UPDATE "Comment" SET "unitId" = the_unit;
  UPDATE "CommentActivity" SET "unitId" = the_unit;
  UPDATE "MealFrameworkException" SET "unitId" = the_unit;
END $$;

-- The request's unit context: lib/unit-db.ts sets app.current_unit_id per
-- transaction. NULL when unset -- including the empty string a pooled
-- connection reports once the setting has been used and reset. A function,
-- not the bare expression, so Prisma can introspect the column defaults
-- that call it.
CREATE FUNCTION scoutbuddy_current_unit_id() RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_unit_id', true), '')
$$;

-- ------------------------------------------------------------
-- 3. NOT NULL, and a default read from the request's unit context
-- (lib/unit-db.ts sets app.current_unit_id per transaction). With no
-- context the default is NULL and the insert fails, rather than landing
-- in some unit by accident.
-- ------------------------------------------------------------

ALTER TABLE "Patrol" ALTER COLUMN "unitId" SET NOT NULL, ALTER COLUMN "unitId" SET DEFAULT scoutbuddy_current_unit_id();
ALTER TABLE "Campout" ALTER COLUMN "unitId" SET NOT NULL, ALTER COLUMN "unitId" SET DEFAULT scoutbuddy_current_unit_id();
ALTER TABLE "CampoutUploadBatch" ALTER COLUMN "unitId" SET NOT NULL, ALTER COLUMN "unitId" SET DEFAULT scoutbuddy_current_unit_id();
ALTER TABLE "Menu" ALTER COLUMN "unitId" SET NOT NULL, ALTER COLUMN "unitId" SET DEFAULT scoutbuddy_current_unit_id();
ALTER TABLE "Meal" ALTER COLUMN "unitId" SET NOT NULL, ALTER COLUMN "unitId" SET DEFAULT scoutbuddy_current_unit_id();
ALTER TABLE "Dish" ALTER COLUMN "unitId" SET NOT NULL, ALTER COLUMN "unitId" SET DEFAULT scoutbuddy_current_unit_id();
ALTER TABLE "Ingredient" ALTER COLUMN "unitId" SET NOT NULL, ALTER COLUMN "unitId" SET DEFAULT scoutbuddy_current_unit_id();
ALTER TABLE "Review" ALTER COLUMN "unitId" SET NOT NULL, ALTER COLUMN "unitId" SET DEFAULT scoutbuddy_current_unit_id();
ALTER TABLE "Comment" ALTER COLUMN "unitId" SET NOT NULL, ALTER COLUMN "unitId" SET DEFAULT scoutbuddy_current_unit_id();
ALTER TABLE "CommentActivity" ALTER COLUMN "unitId" SET NOT NULL, ALTER COLUMN "unitId" SET DEFAULT scoutbuddy_current_unit_id();
ALTER TABLE "MealFrameworkException" ALTER COLUMN "unitId" SET NOT NULL, ALTER COLUMN "unitId" SET DEFAULT scoutbuddy_current_unit_id();

-- ------------------------------------------------------------
-- 4. Indexes (REQ-27.5: every unitId, without exception) and foreign keys
-- ------------------------------------------------------------

CREATE INDEX "Patrol_unitId_idx" ON "Patrol"("unitId");
CREATE INDEX "Campout_unitId_idx" ON "Campout"("unitId");
CREATE INDEX "CampoutUploadBatch_unitId_idx" ON "CampoutUploadBatch"("unitId");
CREATE INDEX "Menu_unitId_idx" ON "Menu"("unitId");
CREATE INDEX "Meal_unitId_idx" ON "Meal"("unitId");
CREATE INDEX "Dish_unitId_idx" ON "Dish"("unitId");
CREATE INDEX "Ingredient_unitId_idx" ON "Ingredient"("unitId");
CREATE INDEX "Review_unitId_idx" ON "Review"("unitId");
CREATE INDEX "Comment_unitId_idx" ON "Comment"("unitId");
CREATE INDEX "CommentActivity_unitId_idx" ON "CommentActivity"("unitId");
CREATE INDEX "MealFrameworkException_unitId_idx" ON "MealFrameworkException"("unitId");

ALTER TABLE "Patrol" ADD CONSTRAINT "Patrol_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Campout" ADD CONSTRAINT "Campout_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CampoutUploadBatch" ADD CONSTRAINT "CampoutUploadBatch_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Menu" ADD CONSTRAINT "Menu_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Dish" ADD CONSTRAINT "Dish_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommentActivity" ADD CONSTRAINT "CommentActivity_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MealFrameworkException" ADD CONSTRAINT "MealFrameworkException_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ------------------------------------------------------------
-- 5. The role unit-scoped queries run as (REQ-27.5). The migration's own
-- role (neondb_owner on Neon) has BYPASSRLS, so policies can't bind it --
-- lib/unit-db.ts switches into this role, which can't bypass them, for
-- every unit-scoped transaction. NOLOGIN: it's never connected to
-- directly, only SET ROLE'd into. Roles are cluster-wide, hence IF NOT
-- EXISTS (Prisma's shadow database shares the cluster).
-- ------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'scoutbuddy_unit') THEN
    CREATE ROLE scoutbuddy_unit NOLOGIN NOBYPASSRLS;
  END IF;
END $$;

GRANT scoutbuddy_unit TO CURRENT_USER WITH INHERIT FALSE, SET TRUE;
GRANT USAGE ON SCHEMA public TO scoutbuddy_unit;
GRANT SELECT, INSERT, UPDATE, DELETE ON
  "Patrol", "Campout", "CampoutUploadBatch", "Menu", "Meal", "Dish", "Ingredient",
  "Review", "Comment", "CommentActivity", "MealFrameworkException"
  TO scoutbuddy_unit;

-- ------------------------------------------------------------
-- 6. Row-Level Security: a row is visible and writable only when its
-- unitId matches the transaction's unit context. No context, no rows.
-- ------------------------------------------------------------

ALTER TABLE "Patrol" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Campout" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CampoutUploadBatch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Menu" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Meal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Dish" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Ingredient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CommentActivity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MealFrameworkException" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "unit_isolation" ON "Patrol" USING ("unitId" = scoutbuddy_current_unit_id()) WITH CHECK ("unitId" = scoutbuddy_current_unit_id());
CREATE POLICY "unit_isolation" ON "Campout" USING ("unitId" = scoutbuddy_current_unit_id()) WITH CHECK ("unitId" = scoutbuddy_current_unit_id());
CREATE POLICY "unit_isolation" ON "CampoutUploadBatch" USING ("unitId" = scoutbuddy_current_unit_id()) WITH CHECK ("unitId" = scoutbuddy_current_unit_id());
CREATE POLICY "unit_isolation" ON "Menu" USING ("unitId" = scoutbuddy_current_unit_id()) WITH CHECK ("unitId" = scoutbuddy_current_unit_id());
CREATE POLICY "unit_isolation" ON "Meal" USING ("unitId" = scoutbuddy_current_unit_id()) WITH CHECK ("unitId" = scoutbuddy_current_unit_id());
CREATE POLICY "unit_isolation" ON "Dish" USING ("unitId" = scoutbuddy_current_unit_id()) WITH CHECK ("unitId" = scoutbuddy_current_unit_id());
CREATE POLICY "unit_isolation" ON "Ingredient" USING ("unitId" = scoutbuddy_current_unit_id()) WITH CHECK ("unitId" = scoutbuddy_current_unit_id());
CREATE POLICY "unit_isolation" ON "Review" USING ("unitId" = scoutbuddy_current_unit_id()) WITH CHECK ("unitId" = scoutbuddy_current_unit_id());
CREATE POLICY "unit_isolation" ON "Comment" USING ("unitId" = scoutbuddy_current_unit_id()) WITH CHECK ("unitId" = scoutbuddy_current_unit_id());
CREATE POLICY "unit_isolation" ON "CommentActivity" USING ("unitId" = scoutbuddy_current_unit_id()) WITH CHECK ("unitId" = scoutbuddy_current_unit_id());
CREATE POLICY "unit_isolation" ON "MealFrameworkException" USING ("unitId" = scoutbuddy_current_unit_id()) WITH CHECK ("unitId" = scoutbuddy_current_unit_id());

-- ------------------------------------------------------------
-- 7. REQ-27.3: no reference may cross a unit boundary. Foreign-key checks
-- ignore RLS, so without this a Unit A menu could still point at a Unit B
-- patrol by id. The message names only the column, never the other row
-- (REQ-27.13).
-- ------------------------------------------------------------

CREATE FUNCTION scoutbuddy_assert_same_unit() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  ref_id TEXT := to_jsonb(NEW) ->> TG_ARGV[0];
  parent_unit_id TEXT;
BEGIN
  IF ref_id IS NULL THEN
    RETURN NEW;
  END IF;
  EXECUTE format('SELECT "unitId" FROM %I WHERE "id" = $1', TG_ARGV[1]) INTO parent_unit_id USING ref_id;
  IF parent_unit_id IS DISTINCT FROM NEW."unitId" THEN
    RAISE EXCEPTION 'cross-unit reference rejected on %.%', TG_TABLE_NAME, TG_ARGV[0] USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER "Menu_campoutId_same_unit" BEFORE INSERT OR UPDATE OF "campoutId", "unitId" ON "Menu" FOR EACH ROW EXECUTE FUNCTION scoutbuddy_assert_same_unit('campoutId', 'Campout');
CREATE TRIGGER "Menu_patrolId_same_unit" BEFORE INSERT OR UPDATE OF "patrolId", "unitId" ON "Menu" FOR EACH ROW EXECUTE FUNCTION scoutbuddy_assert_same_unit('patrolId', 'Patrol');
CREATE TRIGGER "Meal_menuId_same_unit" BEFORE INSERT OR UPDATE OF "menuId", "unitId" ON "Meal" FOR EACH ROW EXECUTE FUNCTION scoutbuddy_assert_same_unit('menuId', 'Menu');
CREATE TRIGGER "Dish_mealId_same_unit" BEFORE INSERT OR UPDATE OF "mealId", "unitId" ON "Dish" FOR EACH ROW EXECUTE FUNCTION scoutbuddy_assert_same_unit('mealId', 'Meal');
CREATE TRIGGER "Ingredient_dishId_same_unit" BEFORE INSERT OR UPDATE OF "dishId", "unitId" ON "Ingredient" FOR EACH ROW EXECUTE FUNCTION scoutbuddy_assert_same_unit('dishId', 'Dish');
CREATE TRIGGER "Review_menuId_same_unit" BEFORE INSERT OR UPDATE OF "menuId", "unitId" ON "Review" FOR EACH ROW EXECUTE FUNCTION scoutbuddy_assert_same_unit('menuId', 'Menu');
CREATE TRIGGER "Comment_menuId_same_unit" BEFORE INSERT OR UPDATE OF "menuId", "unitId" ON "Comment" FOR EACH ROW EXECUTE FUNCTION scoutbuddy_assert_same_unit('menuId', 'Menu');
CREATE TRIGGER "Comment_dishId_same_unit" BEFORE INSERT OR UPDATE OF "dishId", "unitId" ON "Comment" FOR EACH ROW EXECUTE FUNCTION scoutbuddy_assert_same_unit('dishId', 'Dish');
CREATE TRIGGER "Comment_ingredientId_same_unit" BEFORE INSERT OR UPDATE OF "ingredientId", "unitId" ON "Comment" FOR EACH ROW EXECUTE FUNCTION scoutbuddy_assert_same_unit('ingredientId', 'Ingredient');
CREATE TRIGGER "Comment_parentId_same_unit" BEFORE INSERT OR UPDATE OF "parentId", "unitId" ON "Comment" FOR EACH ROW EXECUTE FUNCTION scoutbuddy_assert_same_unit('parentId', 'Comment');
CREATE TRIGGER "CommentActivity_menuId_same_unit" BEFORE INSERT OR UPDATE OF "menuId", "unitId" ON "CommentActivity" FOR EACH ROW EXECUTE FUNCTION scoutbuddy_assert_same_unit('menuId', 'Menu');
CREATE TRIGGER "CommentActivity_commentId_same_unit" BEFORE INSERT OR UPDATE OF "commentId", "unitId" ON "CommentActivity" FOR EACH ROW EXECUTE FUNCTION scoutbuddy_assert_same_unit('commentId', 'Comment');
CREATE TRIGGER "MealFrameworkException_campoutId_same_unit" BEFORE INSERT OR UPDATE OF "campoutId", "unitId" ON "MealFrameworkException" FOR EACH ROW EXECUTE FUNCTION scoutbuddy_assert_same_unit('campoutId', 'Campout');
CREATE TRIGGER "MealFrameworkException_patrolId_same_unit" BEFORE INSERT OR UPDATE OF "patrolId", "unitId" ON "MealFrameworkException" FOR EACH ROW EXECUTE FUNCTION scoutbuddy_assert_same_unit('patrolId', 'Patrol');
-- ADR 0035's tables already carry unitId; their patrol must be in that unit too.
CREATE TRIGGER "UnitMembership_patrolId_same_unit" BEFORE INSERT OR UPDATE OF "patrolId", "unitId" ON "UnitMembership" FOR EACH ROW EXECUTE FUNCTION scoutbuddy_assert_same_unit('patrolId', 'Patrol');
CREATE TRIGGER "UnitInvitation_patrolId_same_unit" BEFORE INSERT OR UPDATE OF "patrolId", "unitId" ON "UnitInvitation" FOR EACH ROW EXECUTE FUNCTION scoutbuddy_assert_same_unit('patrolId', 'Patrol');

-- ------------------------------------------------------------
-- 8. A row's unit is fixed for life. Moving one row between units would
-- strand its children in the old unit; there's no feature that needs it.
-- ------------------------------------------------------------

CREATE FUNCTION scoutbuddy_forbid_unit_change() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW."unitId" IS DISTINCT FROM OLD."unitId" THEN
    RAISE EXCEPTION 'a row cannot move to another unit (%)', TG_TABLE_NAME USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER "Patrol_unitId_fixed" BEFORE UPDATE OF "unitId" ON "Patrol" FOR EACH ROW EXECUTE FUNCTION scoutbuddy_forbid_unit_change();
CREATE TRIGGER "Campout_unitId_fixed" BEFORE UPDATE OF "unitId" ON "Campout" FOR EACH ROW EXECUTE FUNCTION scoutbuddy_forbid_unit_change();
CREATE TRIGGER "CampoutUploadBatch_unitId_fixed" BEFORE UPDATE OF "unitId" ON "CampoutUploadBatch" FOR EACH ROW EXECUTE FUNCTION scoutbuddy_forbid_unit_change();
CREATE TRIGGER "Menu_unitId_fixed" BEFORE UPDATE OF "unitId" ON "Menu" FOR EACH ROW EXECUTE FUNCTION scoutbuddy_forbid_unit_change();
CREATE TRIGGER "Meal_unitId_fixed" BEFORE UPDATE OF "unitId" ON "Meal" FOR EACH ROW EXECUTE FUNCTION scoutbuddy_forbid_unit_change();
CREATE TRIGGER "Dish_unitId_fixed" BEFORE UPDATE OF "unitId" ON "Dish" FOR EACH ROW EXECUTE FUNCTION scoutbuddy_forbid_unit_change();
CREATE TRIGGER "Ingredient_unitId_fixed" BEFORE UPDATE OF "unitId" ON "Ingredient" FOR EACH ROW EXECUTE FUNCTION scoutbuddy_forbid_unit_change();
CREATE TRIGGER "Review_unitId_fixed" BEFORE UPDATE OF "unitId" ON "Review" FOR EACH ROW EXECUTE FUNCTION scoutbuddy_forbid_unit_change();
CREATE TRIGGER "Comment_unitId_fixed" BEFORE UPDATE OF "unitId" ON "Comment" FOR EACH ROW EXECUTE FUNCTION scoutbuddy_forbid_unit_change();
CREATE TRIGGER "CommentActivity_unitId_fixed" BEFORE UPDATE OF "unitId" ON "CommentActivity" FOR EACH ROW EXECUTE FUNCTION scoutbuddy_forbid_unit_change();
CREATE TRIGGER "MealFrameworkException_unitId_fixed" BEFORE UPDATE OF "unitId" ON "MealFrameworkException" FOR EACH ROW EXECUTE FUNCTION scoutbuddy_forbid_unit_change();
