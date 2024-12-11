document.addEventListener('DOMContentLoaded', function() {
    const groupList = document.getElementById('group-list');
    const filterSelect = document.getElementById('filter');

 // Fetch groups from the API
    fetch("/api/groups")
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch groups: ${response.statusText}`);
            }
            return response.json();
        })
        .then(groups => {
            // Clear the container
            groupContainer.innerHTML = "";

            if (groups.length === 0) {
                groupContainer.innerHTML = "<p>No groups found.</p>";
                return;
            }

            // Create boxes for each group
            groups.forEach(group => {
                const groupBox = document.createElement("div");
                groupBox.classList.add("group-box");
                groupBox.innerHTML = `
                    <h3>${group.name}</h3>
                    <p>Game: ${group.game}</p>
                    <p>Time: ${group.time}</p>
                    <p>Players: ${JSON.parse(group.members).length}/${group.teammatesRequired}</p>
                    <button class="expand-btn">Expand</button>
                    <div class="group-details hidden">
                        <p>Activity: ${group.activity}</p>
                        <p>Difficulty: ${group.difficultyRating}</p>
                        <p>Additional Info: ${group.additionalInfo || "N/A"}</p>
                    </div>
                `;

                // Add expand/collapse functionality
                const expandBtn = groupBox.querySelector(".expand-btn");
                const groupDetails = groupBox.querySelector(".group-details");
                expandBtn.addEventListener("click", () => {
                    groupDetails.classList.toggle("hidden");
                    expandBtn.textContent = groupDetails.classList.contains("hidden") ? "Expand" : "Collapse";
                });

                groupContainer.appendChild(groupBox);
            });
        })
        .catch(error => {
            console.error("Error loading groups:", error);
            groupContainer.innerHTML = "<p>Failed to load groups. Please try again later.</p>";
        });
});

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

    // Handle filter changes
    filterSelect.addEventListener('change', function() {
        fetchGroups(this.value);
    });

    // Fetch groups on initial load
    fetchGroups(filterSelect.value);
});
