const SUPABASE_URL = 'https://exvkudranbnuzpjkmwdr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4dmt1ZHJhbmJudXpwamttd2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjcxNjAsImV4cCI6MjA4OTMwMzE2MH0.olYWxZVIW_YKTJUnuyNHOiqfg5pf-vXRq_Ynfy-2Go0';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM ELEMENTS
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const userDisplay = document.getElementById('user-display');
const authError = document.getElementById('auth-error');
let currentScanData = null;

// APP START
checkUser();

async function checkUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
        refreshDashboard(user);
    } else {
        showLogin();
    }
}

function refreshDashboard(user) {
    authSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    userDisplay.innerText = user.email;
    loadCategories();
    loadTransactions();
}

function showLogin() {
    dashboardSection.classList.add('hidden');
    authSection.classList.remove('hidden');
}

// AUTH FUNCTIONS
async function handleSignUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { error } = await supabaseClient.auth.signUp({ email, password });
    if (error) { authError.innerText = error.message; } 
    else { alert("Success! Log in now."); }
}

async function handleSignIn() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) { authError.innerText = error.message; } 
    else { checkUser(); }
}

async function handleSignOut() {
    await supabaseClient.auth.signOut();
    location.reload();
}

// DATA LOADING
async function loadCategories() {
    const select = document.getElementById('manual-category');
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    const { data: profile } = await supabaseClient.from('profiles').select('household_id').eq('id', user.id).single();
    const { data: categories } = await supabaseClient.from('categories').select('*').eq('household_id', profile.household_id).eq('type', 'expense');

    select.innerHTML = '<option value="">Select Category...</option>';
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.innerText = `${cat.icon || '📦'} ${cat.name}`;
        select.appendChild(opt);
    });
}

async function loadTransactions() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const { data: profile } = await supabaseClient.from('profiles').select('household_id').eq('id', user.id).single();
    
    const { data: transactions } = await supabaseClient.from('transactions').select('*, categories(name, icon)').eq('household_id', profile.household_id).order('date', { ascending: false }).limit(10);
    
    const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    document.getElementById('total-amount').innerText = `Rp ${total.toLocaleString('id-ID')}`;

    const listDiv = document.getElementById('transaction-list');
    listDiv.innerHTML = transactions.map(t => `
        <div class="bg-white p-4 rounded-3xl border border-slate-100 flex justify-between items-center shadow-sm">
            <div class="flex items-center gap-3">
                <div class="bg-slate-50 p-3 rounded-2xl text-xl">${t.categories?.icon || '💰'}</div>
                <div>
                    <p class="font-bold text-slate-800 text-sm">${t.note || t.categories?.name}</p>
                    <p class="text-[10px] text-slate-400 font-bold uppercase">${t.date}</p>
                </div>
            </div>
            <p class="font-mono font-bold text-slate-900 text-sm">Rp ${Number(t.amount).toLocaleString('id-ID')}</p>
        </div>
    `).join('');
}

// MANUAL SAVE
async function saveManualExpense() {
    const amount = document.getElementById('manual-amount').value;
    const catId = document.getElementById('manual-category').value;
    const note = document.getElementById('manual-note').value;
    if (!amount || !catId) return alert("Enter amount and category");

    const { data: { user } } = await supabaseClient.auth.getUser();
    const { data: profile } = await supabaseClient.from('profiles').select('household_id').eq('id', user.id).single();

    const { error } = await supabaseClient.from('transactions').insert({
        household_id: profile.household_id, profile_id: user.id, category_id: catId, amount: parseFloat(amount), note: note, date: new Date().toISOString().split('T')[0]
    });

    if (!error) { 
        alert("Saved!"); 
        document.getElementById('manual-amount').value = '';
        loadTransactions(); 
    }
}

// AI SCANNING
async function processReceipt(event) {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById('camera-text').innerText = "AI Reading...";
    document.getElementById('camera-icon').classList.add('animate-pulse');

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        const base64Image = reader.result.split(',')[1];
        try {
            const response = await fetch('/api/analyze', { method: 'POST', body: JSON.stringify({ image: base64Image }) });
            const result = await response.json();
            
            if (result.error) throw new Error(result.error);

            let aiText = result.aiText;
            const start = aiText.indexOf('{');
            const end = aiText.lastIndexOf('}') + 1;
            currentScanData = JSON.parse(aiText.substring(start, end));
            
            displayAIResults(currentScanData);
        } catch (err) {
            alert("AI Error: " + err.message);
            resetCameraUI();
        }
    };
}

function displayAIResults(data) {
    document.getElementById('ai-results').classList.remove('hidden');
    document.getElementById('res-merchant').innerText = data.merchant;
    document.getElementById('res-splits').innerHTML = data.splits.map(s => `
        <div class="flex justify-between text-sm border-b border-indigo-100 pb-2 mb-2">
            <span class="font-bold text-indigo-900">${s.category}</span>
            <span class="font-mono font-bold">Rp ${Number(s.amount).toLocaleString('id-ID')}</span>
        </div>
    `).join('');
    resetCameraUI();
}

function resetCameraUI() {
    document.getElementById('camera-text').innerText = "Scan Receipt (AI)";
    document.getElementById('camera-icon').classList.remove('animate-pulse');
}

async function saveToDatabase() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const { data: profile } = await supabaseClient.from('profiles').select('household_id').eq('id', user.id).single();

    for (const split of currentScanData.splits) {
        await supabaseClient.from('transactions').insert({
            household_id: profile.household_id, profile_id: user.id, amount: split.amount, note: `${currentScanData.merchant}: ${split.category}`, date: new Date().toISOString().split('T')[0]
        });
    }
    alert("Saved!");
    document.getElementById('ai-results').classList.add('hidden');
    loadTransactions();
}
