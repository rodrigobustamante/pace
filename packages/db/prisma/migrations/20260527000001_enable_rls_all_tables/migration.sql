-- Enable Row Level Security on all public tables.
--
-- This app accesses the database exclusively through Prisma on the server
-- side using the service_role connection string. service_role bypasses RLS
-- automatically, so no policies are needed and existing server-side
-- behaviour is unaffected.
--
-- Enabling RLS (with no permissive policies for anon/authenticated) closes
-- direct PostgREST access from the Data API for those roles, which is the
-- correct posture for a backend-only application.

ALTER TABLE "User"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Activity"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CoachInsight"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CoachChat"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Goal"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TrainingPlan"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TrainingDay"   ENABLE ROW LEVEL SECURITY;
