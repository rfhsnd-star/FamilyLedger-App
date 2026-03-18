// CONFIGURATION
const SUPABASE_URL = 'https://exvkudranbnuzpjkmwdr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4dmt1ZHJhbmJudXpwamttd2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjcxNjAsImV4cCI6MjA4OTMwMzE2MH0.olYWxZVIW_YKTJUnuyNHOiqfg5pf-vXRq_Ynfy-2Go0';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM ELEMENTS
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const userDisplay = document.getElementById('user-display');
const authError = document.getElementById('auth-error');

// INITIAL CHECK
checkUser();

async function checkUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
        showDashboard(user);
    } else {
        showLogin();
    }
}

// UI TOGGLES
function showDashboard(user) {
    authSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    userDisplay.innerText = user.email;
}

function showLogin() {
    dashboardSection.classList.add('hidden');
    authSection.classList.remove('hidden');
}

// AUTH
async function handleSignUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Safety Check: Don't let the user submit empty boxes
    if (!email || !password) {
        authError.innerText = "Please enter both email and password.";
        return;
    }

    const { data, error } = await supabaseClient.auth.signUp({ 
        email: email, 
        password: password 
    });

    if (error) {
        authError.innerText = error.message;
    } else {
        alert("Success! You are now a member.");
        checkUser();
    }
}

async function handleSignIn() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        authError.innerText = "Please enter both email and password.";
        return;
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({ 
        email: email, 
        password: password 
    });

    if (error) {
        authError.innerText = error.message;
    } else {
        checkUser();
    }
}
let currentScanData = null;

// 1. Process Receipt Function
async function processReceipt(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Show Loading
    document.getElementById('camera-text').innerText = "AI is thinking...";
    document.getElementById('camera-icon').classList.add('animate-pulse');

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        const base64Image = reader.result.split(',')[1];
        
        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                body: JSON.stringify({ image: base64Image })
            });
            
            const result = await response.json();

            if (result.error) {
                alert("Oops: " + result.error);
                resetCameraUI();
                return;
            }

            // Clean and Parse JSON
            let aiText = result.aiText;
            const start = aiText.indexOf('{');
            const end = aiText.lastIndexOf('}') + 1;
            const jsonString = aiText.substring(start, end);
            
            currentScanData = JSON.parse(jsonString);
            displayResults(currentScanData);
            
        } catch (err) {
            alert("App Error: Could not read receipt. Try a clearer photo.");
            resetCameraUI();
        }
    };
}

// 2. Display Results Function (PUT THIS BELOW THE BRACKET)
function displayResults(data) {
    currentScanData = data; 
    
    document.getElementById('ai-results').classList.remove('hidden');
    document.getElementById('res-merchant').innerText = data.merchant;
    
    const splitDiv = document.getElementById('res-splits');
    splitDiv.innerHTML = data.splits.map(s => `
        <div class="flex justify-between text-sm border-b border-slate-100 pb-2 mb-2">
            <span class="font-bold text-slate-600">${s.category}</span>
            <span class="font-mono text-indigo-600">Rp ${Number(s.amount).toLocaleString('id-ID')}</span>
        </div>
    `).join('');
    
    resetCameraUI();
}

// 3. Reset UI Helper
function resetCameraUI() {
    document.getElementById('camera-text').innerText = "Scan New Receipt";
    document.getElementById('camera-icon').classList.remove('animate-pulse');
}

// 4. Save to Database Function
async function saveToDatabase() {
    if (!currentScanData) return;

    const saveButton = document.querySelector('#ai-results button');
    saveButton.innerText = "Saving to Singapore...";
    saveButton.disabled = true;

    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('household_id')
            .eq('id', user.id)
            .single();

        for (const split of currentScanData.splits) {
            const { error } = await supabaseClient
                .from('transactions')
                .insert({
                    household_id: profile.household_id,
                    profile_id: user.id,
                    amount: split.amount,
                    note: `${currentScanData.merchant}: ${split.category}`,
                    date: new Date().toISOString().split('T')[0]
                });
            
            if (error) throw error;
        }

        alert("🎉 Successfully saved to your Family Ledger!");
        document.getElementById('ai-results').classList.add('hidden');
        resetCameraUI();
        
    } catch (err) {
        alert("Error saving: " + err.message);
        saveButton.innerText = "Confirm & Save";
        saveButton.disabled = false;
    }
}
// --- NEW FEATURES: MANUAL TRACKING ---

// 1. Fetch Categories from Singapore
async function loadCategories() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    // Get the user's household first
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('household_id')
        .eq('id', user.id)
        .single();

    const { data: categories } = await supabaseClient
        .from('categories')
        .select('*')
        .eq('household_id', profile.household_id)
        .eq('type', 'expense');

    const select = document.getElementById('manual-category');
    // Clear existing options
    select.innerHTML = '<option value="">Select Category...</option>';
    
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.innerText = `${cat.icon || '📦'} ${cat.name}`;
        select.appendChild(opt);
    });
}

// 2. Save Manual Expense
async function saveManualExpense() {
    const amount = document.getElementById('manual-amount').value;
    const categoryId = document.getElementById('manual-category').value;
    const note = document.getElementById('manual-note').value;

    if (!amount || !categoryId) {
        alert("Please enter an amount and select a category!");
        return;
    }

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    // Get household_id
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('household_id')
        .eq('id', user.id)
        .single();

    const { error } = await supabaseClient.from('transactions').insert({
        household_id: profile.household_id,
        profile_id: user.id,
        category_id: categoryId,
        amount: parseFloat(amount),
        note: note,
        date: new Date().toISOString().split('T')[0]
    });

    if (error) {
        alert("Error saving: " + error.message);
    } else {
        alert("Expense Saved!");
        // Clear the form
        document.getElementById('manual-amount').value = '';
        document.getElementById('manual-note').value = '';
        loadTransactions(); // Refresh the list
    }
}

// 3. Load Transaction History
async function loadTransactions() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('household_id')
        .eq('id', user.id)
        .single();

    const { data: transactions } = await supabaseClient
        .from('transactions')
        .select('*, categories(name, icon)')
        .eq('household_id', profile.household_id)
        .order('date', { ascending: false })
        .limit(10);

    const listDiv = document.getElementById('transaction-list');
    
    if (transactions.length === 0) {
        listDiv.innerHTML = '<p class="text-center text-slate-400 text-sm py-8 italic">No transactions yet.</p>';
        return;
    }

    listDiv.innerHTML = transactions.map(t => `
        <div class="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
            <div class="flex items-center gap-3">
                <div class="text-xl">${t.categories?.icon || '💰'}</div>
                <div>
                    <p class="font-bold text-slate-800 text-sm">${t.note || t.categories?.name}</p>
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">${t.date}</p>
                </div>
            </div>
            <p class="font-mono font-bold text-slate-900 text-sm">Rp ${Number(t.amount).toLocaleString('id-ID')}</p>
        </div>
    `).join('');
}

// Update the showDashboard function to call these new loaders
const originalShowDashboard = showDashboard;
showDashboard = (user) => {
    originalShowDashboard(user);
    loadCategories();
    loadTransactions();
};
