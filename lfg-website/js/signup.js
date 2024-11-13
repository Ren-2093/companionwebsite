document.getElementById('signup-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'User created successfully') {
            window.location.href = '/home';
        } else {
            alert(data.error || 'An error occurred');
        }
    })
    .catch(error => console.error('Error:', error));
});
