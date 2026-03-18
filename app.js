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
