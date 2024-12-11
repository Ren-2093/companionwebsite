document.addEventListener('DOMContentLoaded', () => {
    const groupList = document.getElementById('group-list');
    const filterSelect = document.getElementById('filter');
    let currentUser = '';

    // Fetch logged-in user's profile
    const fetchCurrentUser = () => {
        return fetch('/api/profile')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch user profile');
                }
                return response.json();
            })
            .then(data => {
                currentUser = data.username; // Logged-in username
            })
            .catch(error => {
                console.error('Error fetching user profile:', error);
            });
    };

    // Fetch and display groups
    const fetchGroups = (filter) => {
        let queryString = filter ? `?filter=${filter}` : '';
        fetch(`/api/groups${queryString}`)
            .then(response => response.json())
            .then(groups => {
                renderGroups(groups);
            })
            .catch(error => console.error('Error fetching groups:', error));
    };

    // Render groups into clickable boxes
    const renderGroups = (groups) => {
        groupList.innerHTML = ''; // Clear the list before rendering
        groups.forEach(group => {
            const groupBox = document.createElement('div');
            groupBox.classList.add('group-box');
            groupBox.innerHTML = `
                <h3>${group.name}</h3>
                <p>Game: ${group.game}</p>
                <p>Time: ${group.time}</p>
                <p>Created By: ${group.createdBy}</p>
                <p>Players: ${group.members ? JSON.parse(group.members).length : 0}/${group.teammatesRequired}</p>
            `;
            groupBox.addEventListener('click', () => expandGroup(group));
            groupList.appendChild(groupBox);
        });
    };

    // Expand and display additional group details in a modal
    const expandGroup = (group) => {
        const modal = document.createElement('div');
        modal.classList.add('modal');
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-button">&times;</span>
                <h3>${group.name}</h3>
                <p><strong>Game:</strong> ${group.game}</p>
                <p><strong>Activity:</strong> ${group.activity}</p>
                <p><strong>Time:</strong> ${group.time}</p>
                <p><strong>Created By:</strong> ${group.createdBy}</p>
                <p><strong>Difficulty:</strong> ${group.difficultyRating}/10</p>
                <p><strong>Additional Info:</strong> ${group.additionalInfo || 'N/A'}</p>
                <p><strong>Players:</strong> ${group.members ? JSON.parse(group.members).join(', ') : 'None'} (${group.members ? JSON.parse(group.members).length : 0}/${group.teammatesRequired})</p>
                <button id="join-button">Join Group</button>
                <button id="leave-button">Leave Group</button>
            </div>
        `;

        // Close modal functionality
        modal.querySelector('.close-button').addEventListener('click', () => {
            modal.remove();
        });

        // Join button functionality
        modal.querySelector('#join-button').addEventListener('click', () => {
            fetch(`/api/groups/${group.id}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user: currentUser })
            })
                .then(response => {
                    if (response.ok) {
                        alert('Successfully joined the group!');
                        fetchGroups(filterSelect.value); // Refresh groups list
                        modal.remove(); // Close the modal
                    } else {
                        response.json().then(err => alert(err.error));
                    }
                })
                .catch(error => console.error('Error joining group:', error));
        });

        // Leave button functionality
        modal.querySelector('#leave-button').addEventListener('click', () => {
            fetch(`/api/groups/${group.id}/leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user: currentUser })
            })
                .then(response => {
                    if (response.ok) {
                        alert('Successfully left the group!');
                        fetchGroups(filterSelect.value); // Refresh groups list
                        modal.remove(); // Close the modal
                    } else {
                        response.json().then(err => alert(err.error));
                    }
                })
                .catch(error => console.error('Error leaving group:', error));
        });

        // Display modal
        document.body.appendChild(modal);
    };

    // Handle filter change
    filterSelect.addEventListener('change', () => {
        fetchGroups(filterSelect.value);
    });

    // Initialize app
    fetchCurrentUser().then(() => fetchGroups());
});
