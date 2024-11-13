document.addEventListener('DOMContentLoaded', function() {
    const timeInput = document.getElementById('time');
    const form = document.getElementById('create-group-form');

    // Set default time to nearest 15-minute interval
    function setDefaultTime() {
        const now = new Date();
        const minutes = Math.ceil(now.getMinutes() / 15) * 15;
        now.setMinutes(minutes);
        timeInput.value = now.toISOString().slice(11, 16); // Format time as HH:MM
    }

    setDefaultTime();

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
            createdBy: formData.get('username') // Capture the creator's username
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
