// Replace these placeholders with your Supabase project values.
// For local development, use the values shown by: supabase status
window.KEYLOCK_SUPABASE_URL = "https://xyluwvzuogdsgzyganqp.supabase.co";
window.KEYLOCK_SUPABASE_ANON_KEY = "sb_publishable_f6_mJK6kgHKTjUMY7V9YJg_i6QCzG3g";

// Default backend used when no ?env / ?apiBase override is provided.
window.KEYLOCK_CALC_API_BASE = "https://mantenimento-app.onrender.com";

// Optional named backends for the published frontend.
// Example usage:
//   https://favagit.github.io/mantenimento-app/?env=dev
//   https://favagit.github.io/mantenimento-app/?env=prod
window.KEYLOCK_CALC_API_ENVS = {
	dev: "",
	prod: "https://mantenimento-app.onrender.com"
};

// Optional frontend variants (used by ?frontend=dev on the published app).
// The dev URL points to the feature branch frontend preview.
window.KEYLOCK_FRONTEND_VARIANT_ENVS = {
	dev: "https://raw.githack.com/FaVaGit/mantenimento-app/feature/v2-scenario-lab/frontend/public/index.html"
};
