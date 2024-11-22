document.addEventListener('DOMContentLoaded', async function() {
    const timeInput = document.getElementById('time');
    const form = document.getElementById('create-group-form');
    let loggedInUsername = null; // To store the logged-in user's username

    // Fetch the logged-in user's profile
    async function fetchUserProfile() {
    try {
        const response = await fetch('/api/profile', {
            credentials: 'include' // Ensures cookies are sent with the request
        });
        const data = await response.json();
        if (data.username) {
            loggedInUsername = data.username;
        } else {
            alert('Failed to fetch user profile. Please log in again.');
            window.location.href = '/'; // Redirect to login if no profile found
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        alert('Unable to fetch user profile.');
    }
}

    // Set default time to the nearest 15-minute interval
    function setDefaultTime() {
        const now = new Date();
        const minutes = Math.ceil(now.getMinutes() / 15) * 15;
        now.setMinutes(minutes);
        timeInput.value = now.toISOString().slice(11, 16); // Format time as HH:MM
    }

    // Initialize the form
    async function init() {
        await fetchUserProfile();
        setDefaultTime();
    }

    init();

    // Handle form submission
    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const formData = new FormData(form);
        const data = {
            name: formData.get('group-name'),
            game: formData.get('game-name'),
            activity: formData.get('activity-name'),
            teammatesRequired: parseInt(formData.get('teammates-required')),
            difficultyRating: parseInt(formData.get('difficulty-rating')),
            time: formData.get('time'),
            additionalInfo: formData.get('additional-info'),
            createdBy: loggedInUsername // Use the logged-in username
        };

        fetch('/api/groups', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.error) {
                alert(`Error: ${result.error}`);
            } else {
                alert('Group created successfully!');
                form.reset();
                setDefaultTime(); // Reset time input after form submission
            }
        })
        .catch(error => {
            console.error('Error creating group:', error);
            alert('Error creating group.');
        });
    });
});
