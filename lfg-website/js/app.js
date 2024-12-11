document.addEventListener('DOMContentLoaded', () => {
    const groupList = document.getElementById('group-list');
    const filterSelect = document.getElementById('filter');

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
                <p>Players: ${group.members ? JSON.parse(group.members).length : 0}/${group.teammatesRequired}</p>
            `;
            groupBox.addEventListener('click', () => expandGroup(group));
            groupList.appendChild(groupBox);
        });
    };

    // Expand and display additional group details
    const expandGroup = (group) => {
        const expandedBox = document.createElement('div');
        expandedBox.classList.add('expanded-group-box');
        expandedBox.innerHTML = `
            <h3>${group.name}</h3>
            <p>Game: ${group.game}</p>
            <p>Activity: ${group.activity}</p>
            <p>Time: ${group.time}</p>
            <p>Difficulty: ${group.difficultyRating}/10</p>
            <p>Players: ${group.members ? JSON.parse(group.members).length : 0}/${group.teammatesRequired}</p>
            <p>Additional Info: ${group.additionalInfo || 'N/A'}</p>
            <button id="close-expanded">Close</button>
        `;
        const closeBtn = expandedBox.querySelector('#close-expanded');
        closeBtn.addEventListener('click', () => {
            expandedBox.remove();
        });

        document.body.appendChild(expandedBox);
    };

    // Listen for filter changes and fetch groups accordingly
    filterSelect.addEventListener('change', (event) => {
        const filter = event.target.value;
        fetchGroups(filter);
    });

    // Initial fetch
    fetchGroups();
});
