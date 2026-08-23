/**
 * Prints any drift between verses.total_contributed_cents and the sum of
 * completed contributions for that verse. Should print nothing under normal
 * operation — the admin UI (/admin) surfaces the same check.
 *
 * Usage: npm run reconcile
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  const { data, error } = await supabase.rpc("reconcile_totals");
  if (error) {
    console.error(error);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log("No drift found. verses.total_contributed_cents matches completed contributions.");
    return;
  }

  console.log(`Found drift in ${data.length} verse(s):`);
  console.table(data);
  process.exitCode = 1;
}

main();
