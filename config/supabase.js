// config/supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  // استخدم SERVICE_ROLE_KEY على السيرفر فقط (ما بتنحط بالفرونت)
  process.env.SUPABASE_KEY
);

module.exports = { supabase };
