import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://krvqwzhjapbhmqnpxool.supabase.co";

const supabaseKey = "sb_publishable_hBHNO6UdxNuAvneVt9jiFg_PGKi4F8l";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);
