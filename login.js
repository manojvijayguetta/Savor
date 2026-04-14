document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/api';
    const clocheReveal = document.getElementById('clocheReveal');
    const loginForm = document.getElementById('loginForm');
    const submitBtn = document.getElementById('submitBtn');
    const socialBtns = document.querySelectorAll('.social-btn');
    
    // Auth Toggling Elements
    const nameGroup = document.getElementById('nameGroup');
    const formOptions = document.getElementById('formOptions');
    const submitText = document.getElementById('submitText');
    const authPrompt = document.getElementById('authPrompt');
    const toggleAuthBtn = document.getElementById('toggleAuthBtn');
    
    // Additional elements for forgot password
    const passwordGroup = document.getElementById('passwordGroup');
    const authDivider = document.getElementById('authDivider');
    const socialLoginArea = document.getElementById('socialLoginArea');
    const forgotPassBtn = document.getElementById('forgotPassBtn');
    
    let isSignup = false;
    let isForgotPassword = false;

    // Toggle between states
    function handleAuthToggle(e) {
        if (e.target && e.target.id === 'toggleAuthBtn') {
            e.preventDefault();
            isSignup = !isSignup;
            isForgotPassword = false; // reset
            hideError();
            
            passwordGroup.style.display = 'block';
            document.getElementById('password').setAttribute('required', 'true');
            authDivider.style.display = 'flex';
            socialLoginArea.style.display = 'flex';
            
            if (isSignup) {
                nameGroup.style.display = 'block';
                formOptions.style.display = 'none';
                submitText.textContent = 'Create Account';
                authPrompt.innerHTML = 'Already have an account? <a href="#" id="toggleAuthBtn">Sign in</a>';
            } else {
                nameGroup.style.display = 'none';
                formOptions.style.display = 'flex';
                submitText.textContent = 'Sign In';
                authPrompt.innerHTML = 'New to Savor? <a href="#" id="toggleAuthBtn">Create an account</a>';
            }
        } else if (e.target && e.target.id === 'backToLoginBtn') {
            e.preventDefault();
            isForgotPassword = false;
            isSignup = false;
            hideError();
            
            // Revert back closely to exactly Login view
            nameGroup.style.display = 'none';
            passwordGroup.style.display = 'block';
            document.getElementById('password').setAttribute('required', 'true');
            formOptions.style.display = 'flex';
            authDivider.style.display = 'flex';
            socialLoginArea.style.display = 'flex';
            
            submitText.textContent = 'Sign In';
            authPrompt.innerHTML = 'New to Savor? <a href="#" id="toggleAuthBtn">Create an account</a>';
        }
    }
    
    // Attach event listener to the parent paragraph to utilize event delegation
    authPrompt.addEventListener('click', handleAuthToggle);
    
    if (forgotPassBtn) {
        forgotPassBtn.addEventListener('click', (e) => {
            e.preventDefault();
            isForgotPassword = true;
            isSignup = false;
            hideError();
            
            // Transform UI
            nameGroup.style.display = 'none';
            passwordGroup.style.display = 'none';
            document.getElementById('password').removeAttribute('required');
            formOptions.style.display = 'none';
            authDivider.style.display = 'none';
            socialLoginArea.style.display = 'none';
            
            submitText.textContent = 'Send Recovery Link';
            authPrompt.innerHTML = '<a href="#" id="backToLoginBtn">Back to Login</a>';
        });
    }

    const authErrorMessage = document.getElementById('authErrorMessage');
    
    function showError(msg) {
        authErrorMessage.textContent = msg;
        authErrorMessage.style.display = 'block';
    }

    function hideError() {
        authErrorMessage.style.display = 'none';
        authErrorMessage.classList.remove('success');
    }

    // Handle form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        hideError();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        // Add loading state
        submitBtn.classList.add('loading');
        
        try {
            if (isForgotPassword) {
                // Mock forgot password for now, or you could add a real endpoint
                setTimeout(() => {
                    submitBtn.classList.remove('loading');
                    if (!email) {
                        showError('Please enter your email address');
                    } else {
                        authErrorMessage.classList.add('success');
                        showError('A recovery link has been sent to your email!');
                    }
                }, 1000);
                return;
            }
            
            const endpoint = isSignup ? '/auth/register' : '/auth/login';
            const body = isSignup 
                ? { email, password, name: document.getElementById('fullname').value.trim() }
                : { email, password };

            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            submitBtn.classList.remove('loading');

            if (data.success) {
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('currentUserName', data.name);
                sessionStorage.setItem('currentEmail', email);
                sessionStorage.setItem('userFavorites', JSON.stringify(data.favorites || []));
                window.location.replace('index.html');
            } else {
                showError(data.message || 'Authentication failed');
            }
        } catch (err) {
            submitBtn.classList.remove('loading');
            showError('Server connection failed. Is the backend running?');
            console.error(err);
        }
    });

    // Handle social logins (Mocking OAuth behavior for prototype)
    socialBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            hideError();
            
            const originalIcon = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            
            setTimeout(() => {
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('currentUserName', 'Social User');
                window.location.replace('index.html');
            }, 1200);
        });
    });

    // Trigger the setup animation after a brief delay
    setTimeout(() => {
        clocheReveal.classList.add('lift');
        document.body.classList.add('revealed');
    }, 1500);
});
