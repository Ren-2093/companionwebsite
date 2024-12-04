document.addEventListener('DOMContentLoaded', function() {
    const groupList = document.getElementById('group-list');
    const filterSelect = document.getElementById('filter');

    // Fetch and display all groups with optional filtering
    function fetchGroups(filter) {
        let filterQuery = '';
        if (filter) {
            filterQuery = `?filter=${filter}`;
        }

        fetch(`/api/groups${filterQuery}`)
            .then(response => response.json())
            .then(groups => {
                if (!Array.isArray(groups)) {
                    throw new Error('Invalid response format');
                }
                groupList.innerHTML = groups.map(group => `
                    <div>
                        <h3>${group.name || 'Group name not available'}</h3>
                        <p>Game: ${group.game || 'Game not available'}</p>
                        <p>Activity: ${group.activity || 'Activity not available'}</p>
                        <p>Teammates Required: ${group.teammatesRequired !== null ? group.teammatesRequired : 'Teammates required not available'}</p>
                        <p>Difficulty Rating: ${group.difficultyRating !== null ? group.difficultyRating : 'Difficulty rating not available'}</p>
                        <p>Time: ${group.time || 'Time not available'}</p>
                        <p>Additional Info: ${group.additionalInfo || 'No additional info provided'}</p>
                        <p>Created By: ${group.createdBy || 'Creator information not available'}</p>
                        <p>Members: ${JSON.parse(group.members).join(', ') || 'No members yet'}</p>
                        <button class="join-group" data-id="${group.id}">Join</button>
                        <button class="leave-group" data-id="${group.id}">Leave</button>
                        <button class="delete-btn" data-group-id="${group.id}">Delete</button>
                    </div>
                `).join('');

                // Add event listeners for join and leave buttons
                const joinButtons = document.querySelectorAll('.join-group');
                joinButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        const groupId = this.dataset.id;
                        const username = prompt('Enter your username:');
                        if (username) {
                            joinGroup(groupId, username);
                        }
                    });
                });

                const leaveButtons = document.querySelectorAll('.leave-group');
                leaveButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        const groupId = this.dataset.id;
                        const username = prompt('Enter your username to leave:');
                        if (username) {
                            leaveGroup(groupId, username);
                        }
                    });
                });
            })
            .catch(error => console.error('Error fetching groups:', error));
    }

    // Function to join a group
    function joinGroup(groupId, username) {
        fetch(`/api/groups/${groupId}/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user: username })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(`Error joining group: ${data.error}`);
            } else {
                alert('Successfully joined the group!');
                fetchGroups(filterSelect.value);
            }
        })
        .catch(error => console.error('Error joining group:', error));
    }

    // Function to leave a group
    function leaveGroup(groupId, username) {
        fetch(`/api/groups/${groupId}/leave`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user: username })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(`Error leaving group: ${data.error}`);
            } else {
                alert('Successfully left the group!');
                fetchGroups(filterSelect.value);
            }
        })
        .catch(error => console.error('Error leaving group:', error));
    }

    // Function to delete a group by ID
    async function deleteGroup(groupId) {
        try {
            const response = await fetch(`/api/groups/${groupId}`, {
                method: 'DELETE',
                credentials: 'include', // Include cookies for user authentication
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                alert('Listing deleted successfully!');
                // Remove the listing from the UI
                document.getElementById(`group-${groupId}`).remove();
            } else if (response.status === 403) {
                alert('You are not authorized to delete this listing.');
            } else {
                alert('Failed to delete the listing. Please try again.');
            }
        } catch (error) {
            console.error('Error deleting the group:', error);
            alert('An error occurred while trying to delete the listing.');
        }
    }

    // Add event listeners to delete buttons
    groupList.addEventListener('click', function (event) {
        if (event.target.classList.contains('delete-btn')) {
            const groupId = event.target.dataset.groupId; // Ensure the button includes this data attribute
            if (confirm('Are you sure you want to delete this listing?')) {
                deleteGroup(groupId);
            }
        }
    });

    // Handle filter changes
    filterSelect.addEventListener('change', function() {
        fetchGroups(this.value);
    });

    // Fetch groups on initial load
    fetchGroups(filterSelect.value);
});
