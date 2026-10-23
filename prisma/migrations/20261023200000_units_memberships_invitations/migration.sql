-- REQ-34 / ADR 0035: units, the Council -> District -> Unit hierarchy,
-- per-unit memberships, and email invitations. Hand-ordered (not Prisma's
-- generated order) so the backfill below runs before User.role/patrolId
-- are dropped -- same hand-written-migration-with-backfill style as
-- ADR 0018's patrols migration.

-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('PACK', 'TROOP', 'CREW', 'SHIP', 'POST');

-- CreateEnum
CREATE TYPE "GenderDesignation" AS ENUM ('BOYS', 'GIRLS', 'FAMILY');

-- CreateEnum
CREATE TYPE "UnitRole" AS ENUM ('ASPL', 'PATROL_LEADER');

-- CreateEnum
CREATE TYPE "UnitMembershipSource" AS ENUM ('INVITATION', 'MIGRATION');

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "activeUnitId" TEXT;

-- CreateTable
CREATE TABLE "Council" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Council_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "District" (
    "id" TEXT NOT NULL,
    "councilId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "unitType" "UnitType" NOT NULL,
    "unitNumber" INTEGER NOT NULL,
    "genderDesignation" "GenderDesignation" NOT NULL,
    "districtId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "role" "UnitRole" NOT NULL,
    "patrolId" TEXT,
    "source" "UnitMembershipSource" NOT NULL,
    "invitationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnitMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitInvitation" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UnitRole" NOT NULL,
    "patrolId" TEXT,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "invitedById" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnitInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitEvent" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorUserId" TEXT,
    "subjectUserId" TEXT,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnitEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Council_number_key" ON "Council"("number");

-- CreateIndex
CREATE UNIQUE INDEX "District_councilId_normalizedName_key" ON "District"("councilId", "normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_districtId_unitType_unitNumber_genderDesignation_key" ON "Unit"("districtId", "unitType", "unitNumber", "genderDesignation");

-- CreateIndex
CREATE UNIQUE INDEX "UnitMembership_invitationId_key" ON "UnitMembership"("invitationId");

-- CreateIndex
CREATE INDEX "UnitMembership_unitId_idx" ON "UnitMembership"("unitId");

-- CreateIndex
CREATE UNIQUE INDEX "UnitMembership_userId_unitId_key" ON "UnitMembership"("userId", "unitId");

-- CreateIndex
CREATE UNIQUE INDEX "UnitInvitation_tokenHash_key" ON "UnitInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "UnitInvitation_unitId_idx" ON "UnitInvitation"("unitId");

-- CreateIndex
CREATE INDEX "UnitEvent_unitId_createdAt_idx" ON "UnitEvent"("unitId", "createdAt");

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_councilId_fkey" FOREIGN KEY ("councilId") REFERENCES "Council"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitMembership" ADD CONSTRAINT "UnitMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitMembership" ADD CONSTRAINT "UnitMembership_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitMembership" ADD CONSTRAINT "UnitMembership_patrolId_fkey" FOREIGN KEY ("patrolId") REFERENCES "Patrol"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitMembership" ADD CONSTRAINT "UnitMembership_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "UnitInvitation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitInvitation" ADD CONSTRAINT "UnitInvitation_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitInvitation" ADD CONSTRAINT "UnitInvitation_patrolId_fkey" FOREIGN KEY ("patrolId") REFERENCES "Patrol"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitInvitation" ADD CONSTRAINT "UnitInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnitEvent" ADD CONSTRAINT "UnitEvent_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- REQ-34.12: Scouting America unit numbers are 1-9999. Council numbers are
-- positive (REQ-34.14). Prisma's schema language can't express CHECK
-- constraints, so they live only here.
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_unitNumber_range" CHECK ("unitNumber" BETWEEN 1 AND 9999);
ALTER TABLE "Council" ADD CONSTRAINT "Council_number_positive" CHECK ("number" > 0);

-- REQ-34.15: seeded reference list of Scouting America councils and their
-- numbers (235 councils), from Wikipedia's "List of councils (Scouting
-- America)" as of 2026-10-23. Excludes the four former region numbers
-- (901-904) and the National Council (999), which no unit belongs to;
-- includes Direct Service (800), which units do. Corrections are a later
-- hand edit (REQ-34's Out of Scope: no automatic sync).
INSERT INTO "Council" ("id", "number", "name") VALUES
    ('council_1', 1, 'Greater Alabama Council'),
    ('council_3', 3, 'Alabama-Florida Council'),
    ('council_4', 4, 'Mobile Area Council'),
    ('council_5', 5, 'Tukabatchee Area Council'),
    ('council_6', 6, 'Black Warrior Council'),
    ('council_10', 10, 'Grand Canyon Council'),
    ('council_11', 11, 'Catalina Council'),
    ('council_18', 18, 'Natural State Council'),
    ('council_23', 23, 'Golden Gate Area Council'),
    ('council_27', 27, 'Sequoia Council'),
    ('council_30', 30, 'Southern Sierra Council'),
    ('council_31', 31, 'Pacific Skyline Council'),
    ('council_32', 32, 'Long Beach Area Council'),
    ('council_33', 33, 'Greater Los Angeles Area Council'),
    ('council_35', 35, 'Marin Council'),
    ('council_39', 39, 'Orange County Council'),
    ('council_41', 41, 'Redwood Empire Council'),
    ('council_42', 42, 'Piedmont Council'),
    ('council_45', 45, 'California Inland Empire Council'),
    ('council_47', 47, 'Golden Empire Council'),
    ('council_49', 49, 'San Diego-Imperial Council'),
    ('council_51', 51, 'Western Los Angeles County Council'),
    ('council_53', 53, 'Los Padres Council'),
    ('council_55', 55, 'Silicon Valley Monterey Bay Council'),
    ('council_57', 57, 'Ventura County Council'),
    ('council_58', 58, 'Verdugo Hills Council'),
    ('council_59', 59, 'Greater Yosemite Council'),
    ('council_60', 60, 'Pathway to the Rockies Council'),
    ('council_61', 61, 'Greater Colorado Council'),
    ('council_62', 62, 'Adventure West Council'),
    ('council_66', 66, 'Connecticut Rivers Council'),
    ('council_67', 67, 'Greenwich Council'),
    ('council_70', 70, 'Old North State Council'),
    ('council_72', 72, 'Connecticut Yankee Council'),
    ('council_81', 81, 'Del-Mar-Va Council'),
    ('council_82', 82, 'National Capital Area Council'),
    ('council_83', 83, 'Central Florida Council'),
    ('council_84', 84, 'South Florida Council'),
    ('council_85', 85, 'Gulf Stream Council'),
    ('council_87', 87, 'North Florida Council'),
    ('council_88', 88, 'Southwest Florida Council'),
    ('council_89', 89, 'Greater Tampa Bay Area Council'),
    ('council_91', 91, 'Chattahoochee Council'),
    ('council_92', 92, 'Atlanta Area Council'),
    ('council_93', 93, 'Georgia-Carolina Council'),
    ('council_95', 95, 'Flint River Council'),
    ('council_96', 96, 'Central Georgia Council'),
    ('council_98', 98, 'South Georgia Council'),
    ('council_99', 99, 'Coastal Georgia Council'),
    ('council_100', 100, 'Northwest Georgia Council'),
    ('council_101', 101, 'Northeast Georgia Council'),
    ('council_104', 104, 'Aloha Council'),
    ('council_106', 106, 'Mountain West Council'),
    ('council_107', 107, 'Grand Teton Council'),
    ('council_117', 117, 'Prairielands Council'),
    ('council_127', 127, 'Three Fires Council'),
    ('council_129', 129, 'Northeast Illinois Council'),
    ('council_133', 133, 'Illowa Council'),
    ('council_138', 138, 'W. D. Boyce Council'),
    ('council_141', 141, 'Mississippi Valley Council'),
    ('council_144', 144, 'Abraham Lincoln Council'),
    ('council_145', 145, 'Hoosier Trails Council'),
    ('council_156', 156, 'Buffalo Trace Council'),
    ('council_157', 157, 'Anthony Wayne Area Council'),
    ('council_160', 160, 'Crossroads of America Council'),
    ('council_162', 162, 'Sagamore Council'),
    ('council_165', 165, 'La Salle Council'),
    ('council_172', 172, 'Hawkeye Area Council'),
    ('council_173', 173, 'Winnebago Council'),
    ('council_177', 177, 'Mid-Iowa Council'),
    ('council_178', 178, 'Northeast Iowa Council'),
    ('council_192', 192, 'Coronado Area Council'),
    ('council_197', 197, 'Jayhawk Area Council'),
    ('council_198', 198, 'Quivira Council'),
    ('council_204', 204, 'Blue Grass Council'),
    ('council_205', 205, 'Lincoln Heritage Council'),
    ('council_209', 209, 'Calcasieu Area Council'),
    ('council_211', 211, 'Istrouma Area Council'),
    ('council_212', 212, 'Evangeline Area Council'),
    ('council_213', 213, 'Louisiana Purchase Council'),
    ('council_214', 214, 'Southeast Louisiana Council'),
    ('council_215', 215, 'Norwela Council'),
    ('council_216', 216, 'Katahdin Area Council'),
    ('council_218', 218, 'Pine Tree Council'),
    ('council_220', 220, 'Baltimore Area Council'),
    ('council_224', 224, 'Cape Cod and the Islands Council'),
    ('council_227', 227, 'Spirit of Adventure Council'),
    ('council_230', 230, 'Heart of New England Council'),
    ('council_234', 234, 'Western Massachusetts Council'),
    ('council_250', 250, 'Northern Star Council'),
    ('council_251', 251, 'Mayflower Council'),
    ('council_283', 283, 'Twin Valley Council'),
    ('council_296', 296, 'Central Minnesota Council'),
    ('council_299', 299, 'Gamehaven Council'),
    ('council_302', 302, 'Choctaw Area Council'),
    ('council_303', 303, 'Andrew Jackson Council'),
    ('council_304', 304, 'Pine Burr Area Council'),
    ('council_306', 306, 'Ozark Trails Council'),
    ('council_307', 307, 'Heart of America Council'),
    ('council_311', 311, 'Pony Express Council'),
    ('council_312', 312, 'Greater Saint Louis Area Council'),
    ('council_315', 315, 'Montana Council'),
    ('council_324', 324, 'Cornhusker Council'),
    ('council_326', 326, 'Mid-America Council'),
    ('council_328', 328, 'Las Vegas Area Council'),
    ('council_329', 329, 'Nevada Area Council'),
    ('council_330', 330, 'Daniel Webster Council'),
    ('council_333', 333, 'Northern New Jersey Council'),
    ('council_341', 341, 'Jersey Shore Council'),
    ('council_347', 347, 'Monmouth Council'),
    ('council_358', 358, 'Patriots'' Path Council'),
    ('council_364', 364, 'Twin Rivers Council'),
    ('council_368', 368, 'Baden-Powell Council'),
    ('council_373', 373, 'Longhouse Council'),
    ('council_380', 380, 'Great Falls Council'),
    ('council_382', 382, 'Allegheny Highlands Council'),
    ('council_386', 386, 'Theodore Roosevelt Council'),
    ('council_388', 388, 'Greater Hudson Valley Council'),
    ('council_397', 397, 'Seneca Waterways Council'),
    ('council_400', 400, 'Leatherstocking Council'),
    ('council_404', 404, 'Suffolk County Council'),
    ('council_405', 405, 'Rip Van Winkle Council'),
    ('council_412', 412, 'High Desert Council'),
    ('council_413', 413, 'Conquistador Council'),
    ('council_414', 414, 'Daniel Boone Council'),
    ('council_415', 415, 'Mecklenburg County Council'),
    ('council_416', 416, 'Central North Carolina Council'),
    ('council_420', 420, 'Piedmont Council'),
    ('council_421', 421, 'Occoneechee Council'),
    ('council_424', 424, 'Tuscarora Council'),
    ('council_425', 425, 'Cape Fear Council'),
    ('council_426', 426, 'East Carolina Council'),
    ('council_427', 427, 'Old Hickory Council'),
    ('council_429', 429, 'Northern Lights Council'),
    ('council_433', 433, 'Great Trail Council'),
    ('council_436', 436, 'Buckeye Council'),
    ('council_438', 438, 'Dan Beard Council'),
    ('council_439', 439, 'Tecumseh Council'),
    ('council_440', 440, 'Lake Erie Council'),
    ('council_441', 441, 'Simon Kenton Council'),
    ('council_444', 444, 'Miami Valley Council'),
    ('council_449', 449, 'Black Swamp Area Council'),
    ('council_456', 456, 'Pathway to Adventure Council'),
    ('council_460', 460, 'Erie Shores Council'),
    ('council_467', 467, 'Muskingum Valley Council'),
    ('council_468', 468, 'Arbuckle Area Council'),
    ('council_469', 469, 'Cherokee Area Council'),
    ('council_480', 480, 'Last Frontier Council'),
    ('council_488', 488, 'Indian Nations Council'),
    ('council_492', 492, 'Cascade Pacific Council'),
    ('council_497', 497, 'Juniata Valley Council'),
    ('council_500', 500, 'Moraine Trails Council'),
    ('council_501', 501, 'Northeastern Pennsylvania Council'),
    ('council_502', 502, 'Minsi Trails Council'),
    ('council_504', 504, 'Columbia-Montour Council'),
    ('council_509', 509, 'Bucktail Council'),
    ('council_512', 512, 'Westmoreland-Fayette Council'),
    ('council_524', 524, 'Pennsylvania Dutch Council'),
    ('council_525', 525, 'Cradle of Liberty Council'),
    ('council_527', 527, 'Laurel Highlands Council'),
    ('council_528', 528, 'Hawk Mountain Council'),
    ('council_532', 532, 'French Creek Council'),
    ('council_533', 533, 'Susquehanna Council'),
    ('council_538', 538, 'Chief Cornplanter Council'),
    ('council_539', 539, 'Chester County Council'),
    ('council_544', 544, 'New Birth of Freedom Council'),
    ('council_546', 546, 'Narragansett Council'),
    ('council_549', 549, 'Palmetto Area Council'),
    ('council_550', 550, 'Coastal Carolina Council'),
    ('council_551', 551, 'Blue Ridge Council'),
    ('council_553', 553, 'Indian Waters Council'),
    ('council_556', 556, 'Cherokee Area Council'),
    ('council_557', 557, 'Great Smoky Mountain Council'),
    ('council_558', 558, 'Chickasaw Council'),
    ('council_559', 559, 'West Tennessee Area Council'),
    ('council_560', 560, 'Middle Tennessee Council'),
    ('council_561', 561, 'Texas Trails Council'),
    ('council_562', 562, 'Golden Spread Council'),
    ('council_564', 564, 'Capitol Area Council'),
    ('council_567', 567, 'Buffalo Trail Council'),
    ('council_571', 571, 'Circle Ten Council'),
    ('council_574', 574, 'Bay Area Council'),
    ('council_576', 576, 'Sam Houston Area Council'),
    ('council_577', 577, 'South Texas Council'),
    ('council_578', 578, 'Three Rivers Council'),
    ('council_583', 583, 'Alamo Area Council'),
    ('council_584', 584, 'Caddo Area Council'),
    ('council_585', 585, 'East Texas Area Council'),
    ('council_587', 587, 'Northwest Texas Council'),
    ('council_590', 590, 'Crossroads of the West Council'),
    ('council_592', 592, 'Green Mountain Council'),
    ('council_595', 595, 'Colonial Virginia Council'),
    ('council_596', 596, 'Tidewater Council'),
    ('council_598', 598, 'Shenandoah Area Council'),
    ('council_599', 599, 'Blue Ridge Mountains Council'),
    ('council_602', 602, 'Heart of Virginia Council'),
    ('council_604', 604, 'Blue Mountain Council'),
    ('council_606', 606, 'Mount Baker Council'),
    ('council_609', 609, 'Chief Seattle Council'),
    ('council_610', 610, 'Great Alaska Council'),
    ('council_611', 611, 'Inland Northwest Council'),
    ('council_612', 612, 'Pacific Harbors Council'),
    ('council_615', 615, 'Mountaineer Area Council'),
    ('council_617', 617, 'Buckskin Council'),
    ('council_620', 620, 'Glacier''s Edge Council'),
    ('council_624', 624, 'Gateway Area Council'),
    ('council_627', 627, 'Samoset Council'),
    ('council_635', 635, 'Bay-Lakes Council'),
    ('council_636', 636, 'Three Harbors Council'),
    ('council_637', 637, 'Chippewa Valley Council'),
    ('council_640', 640, 'Greater New York Councils'),
    ('council_651', 651, 'Potawatomi Area Council'),
    ('council_653', 653, 'Great Rivers Council'),
    ('council_660', 660, 'Blackhawk Area Council'),
    ('council_661', 661, 'Puerto Rico Council'),
    ('council_662', 662, 'Longhorn Council'),
    ('council_664', 664, 'Suwannee River Area Council'),
    ('council_690', 690, 'Garden State Council'),
    ('council_694', 694, 'South Plains Council'),
    ('council_695', 695, 'Black Hills Area Council'),
    ('council_696', 696, 'Midnight Sun Council'),
    ('council_697', 697, 'Pacific Crest Council'),
    ('council_702', 702, 'Rainbow Council'),
    ('council_713', 713, 'Sequoyah Council'),
    ('council_733', 733, 'Sioux Council'),
    ('council_741', 741, 'Texas Southwest Council'),
    ('council_748', 748, 'Natchez Trace Council'),
    ('council_763', 763, 'Virginia Headwaters Council'),
    ('council_773', 773, 'Gulf Coast Council'),
    ('council_775', 775, 'Rio Grande Council'),
    ('council_777', 777, 'Washington Crossing Council'),
    ('council_780', 780, 'Michigan Crossroads Council'),
    ('council_800', 800, 'Direct Service'),
    ('council_802', 802, 'Transatlantic Council'),
    ('council_803', 803, 'Far East Council');

-- REQ-27.19: today's single unit, backfilled. A fictitious identity chosen
-- by the user (2026-10-23) -- Troop 8 (Boys), Buckeye District, council
-- 433 -- to be corrected through the Platform Admin tools (Requirement 38)
-- once real values are wanted.
INSERT INTO "District" ("id", "councilId", "name", "normalizedName")
VALUES ('district_433_buckeye', 'council_433', 'Buckeye District', 'buckeye district');

INSERT INTO "Unit" ("id", "unitType", "unitNumber", "genderDesignation", "districtId")
VALUES ('unit_troop_8_boys', 'TROOP', 8, 'BOYS', 'district_433_buckeye');

-- Every existing account's interim role/patrol (ADR 0033) becomes a
-- membership in that unit, marked MIGRATION rather than INVITATION
-- (REQ-34.5: every membership is traceable to how it was created). A
-- Patrol Leader row with no patrol already had no access (lib/session.ts),
-- so it's skipped rather than carried over as a broken membership.
INSERT INTO "UnitMembership" ("id", "userId", "unitId", "role", "patrolId", "source")
SELECT 'membership_' || "id", "id", 'unit_troop_8_boys', "role"::"UnitRole", "patrolId", 'MIGRATION'
FROM "User"
WHERE "role" = 'ASPL' OR ("role" = 'PATROL_LEADER' AND "patrolId" IS NOT NULL);

-- REQ-34.3: existing sessions start out acting in that unit (lib/session.ts
-- would re-resolve them to it anyway; this just saves the first write).
UPDATE "Session" SET "activeUnitId" = 'unit_troop_8_boys'
WHERE "userId" IN (SELECT "userId" FROM "UnitMembership");

-- Only now that every role/patrol has a membership: drop ADR 0033's
-- interim columns.
ALTER TABLE "User" DROP CONSTRAINT "User_patrolId_fkey";
ALTER TABLE "User" DROP COLUMN "patrolId",
DROP COLUMN "role";
