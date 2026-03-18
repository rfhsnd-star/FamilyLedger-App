// Replace these with your actual details from Supabase
const SUPABASE_URL = 'https://exvkudranbnuzpjkmwdr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4dmt1ZHJhbmJudXpwamttd2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjcxNjAsImV4cCI6MjA4OTMwMzE2MH0.olYWxZVIW_YKTJUnuyNHOiqfg5pf-vXRq_Ynfy-2Go0';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkConnection() {
    const statusDiv = document.getElementById('status');
    try {
        // This tries to read from your categories table
        const { data, error } = await supabaseClient.from('categories').select('count');
        
        if (error) {
            statusDiv.className = "py-4 px-6 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100 text-sm";
            statusDiv.innerHTML = "⚠️ Connected, but need to login.";
        } else {
            statusDiv.className = "py-4 px-6 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-sm";
            statusDiv.innerHTML = "✅ Live & Connected to Singapore!";
        }
    } catch (err) {
        statusDiv.className = "py-4 px-6 rounded-2xl bg-red-50 text-red-700 border border-red-100 text-sm";
        statusDiv.innerHTML = "❌ Connection Error: " + err.message;
    }
}

checkConnection();
