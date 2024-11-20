const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const session = require('express-session');

// Initialize the app
const app = express();
const PORT = process.env.PORT || 3000;

// Create and open the SQLite database
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        // Create the groups and users table
        db.run(`
            CREATE TABLE IF NOT EXISTS groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                game TEXT NOT NULL,
                activity TEXT NOT NULL,
                teammatesRequired INTEGER CHECK(teammatesRequired BETWEEN 1 AND 12),
                difficultyRating INTEGER CHECK(difficultyRating BETWEEN 1 AND 10),
                time TEXT NOT NULL,
                additionalInfo TEXT,
                createdBy TEXT NOT NULL,
                members TEXT
            );
        `, (err) => {
            if (err) {
                console.error('Error creating groups table:', err.message);
            } else {
                console.log('Groups table created or already exists.');
            }
        });

        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL
            );
        `, (err) => {
            if (err) {
                console.error('Error creating users table:', err.message);
            } else {
                console.log('Users table created or already exists.');
            }
        });
    }
});

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'lfg-website')));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true } // Set to true if you're using HTTPS
}));

// Serve the login page (this will be the first page)
app.get('/', (req, res) => {
    if (req.session.user) {
        return res.redirect('/'); // Redirect logged-in users to home
    }
    res.sendFile(path.join(__dirname, 'lfg-website', 'index.html'));
});

// Serve the signup page
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'lfg-website', 'signup.html'));
});

// Serve the home page (after login)
app.get('/home', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login.html'); // Redirect to login if not logged in
    }
    res.sendFile(path.join(__dirname, 'lfg-website', 'home.html'));
});

// Serve the find-group page
app.get('/find-group', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/'); // Redirect to login if not logged in
    }
    res.sendFile(path.join(__dirname, 'lfg-website', 'find-group.html'));
});

// Serve the create-group page
app.get('/create-group', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/'); // Redirect to login if not logged in
    }
    res.sendFile(path.join(__dirname, 'lfg-website', 'create-group.html'));
});

// Handle user signup
app.post('/signup', (req, res) => {
    const { username, password } = req.body;

    // Validate inputs
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    // Hash the password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).json({ error: 'Error hashing password' });
        }

        // Insert the new user into the database
        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function (err) {
            if (err) {
                return res.status(500).json({ error: 'Error creating user: ' + err.message });
            }
            res.status(201).json({ message: 'User created successfully' });
        });
    });
});

// Handle user login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Validate inputs
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    // Retrieve the user from the database
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Error retrieving user' });
        }
        if (!user) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        // Compare the provided password with the stored hash
        bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Error comparing passwords' });
            }
            if (result) {
                // Successful login
                req.session.user = { id: user.id, username: user.username }; // Store user in session
                res.status(200).json({ message: 'Login successful' });
            } else {
                return res.status(400).json({ error: 'Invalid username or password' });
            }
        });
    });
});

// Logout user
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to logout' });
        }
        res.status(200).json({ message: 'Logout successful' });
    });
});

// Serve the home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'lfg-website', 'index.html'));
});

// Serve the find-group page
app.get('/find-group', (req, res) => {
    res.sendFile(path.join(__dirname, 'lfg-website', 'find-group.html'));
});

// Serve the create-group page
app.get('/create-group', (req, res) => {
    res.sendFile(path.join(__dirname, 'lfg-website', 'create-group.html'));
});

// Create a new group
app.post('/api/groups', (req, res) => {
    const { name, game, activity, teammatesRequired, difficultyRating, time, additionalInfo, createdBy } = req.body;
    const members = JSON.stringify([createdBy]); // Initialize members with the creator

    // Validate input
    if (teammatesRequired > 12) {
        return res.status(400).json({ error: 'Teammates required cannot exceed 12.' });
    }
    if (difficultyRating < 1 || difficultyRating > 10) {
        return res.status(400).json({ error: 'Difficulty rating must be between 1 and 10.' });
    }

    db.run(`INSERT INTO groups (name, game, activity, teammatesRequired, difficultyRating, time, additionalInfo, createdBy, members) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, game, activity, teammatesRequired, difficultyRating, time, additionalInfo, createdBy, members],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID });
        }
    );
});

// Get all groups with optional filtering
app.get('/api/groups', (req, res) => {
    const { name, game, activity, minTeammates, maxTeammates, minDifficulty, maxDifficulty, time, filter } = req.query;
    let sql = 'SELECT * FROM groups WHERE 1=1';
    const params = [];

    if (name) {
        sql += ' AND name LIKE ?';
        params.push(`%${name}%`);
    }
    if (game) {
        sql += ' AND game LIKE ?';
        params.push(`%${game}%`);
    }
    if (activity) {
        sql += ' AND activity LIKE ?';
        params.push(`%${activity}%`);
    }
    if (minTeammates) {
        sql += ' AND teammatesRequired >= ?';
        params.push(minTeammates);
    }
    if (maxTeammates) {
        sql += ' AND teammatesRequired <= ?';
        params.push(maxTeammates);
    }
    if (minDifficulty) {
        sql += ' AND difficultyRating >= ?';
        params.push(minDifficulty);
    }
    if (maxDifficulty) {
        sql += ' AND difficultyRating <= ?';
        params.push(maxDifficulty);
    }
    if (time) {
        sql += ' AND time LIKE ?';
        params.push(`%${time}%`);
    }

    if (filter === 'alphabetical') {
        sql += ' ORDER BY name COLLATE NOCASE ASC';  // Alphabetical order
    } else if (filter === 'time') {
        sql += ' ORDER BY time ASC';  // Time order
    } else if (filter === 'game') {
        sql += ' ORDER BY game COLLATE NOCASE ASC';  // Game order
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(200).json(rows);
    });
});


// Get a group by ID
app.get('/api/groups/:id', (req, res) => {
    const groupId = req.params.id;

    db.get('SELECT * FROM groups WHERE id = ?', [groupId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Group not found' });
        }
        res.status(200).json(row);
    });
});

// Join a group
app.post('/api/groups/:id/join', (req, res) => {
    const groupId = req.params.id;
    const { user } = req.body;

    if (!user) {
        return res.status(400).json({ error: 'User is required' });
    }

    db.get('SELECT members, teammatesRequired FROM groups WHERE id = ?', [groupId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const members = JSON.parse(row.members);
        if (members.length >= row.teammatesRequired) {
            return res.status(400).json({ error: 'Group is full' });
        }

        if (!members.includes(user)) {
            members.push(user);
        }

        db.run('UPDATE groups SET members = ? WHERE id = ?', [JSON.stringify(members), groupId], (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(200).json({ id: groupId, members });
        });
    });
});

// Leave a group
app.post('/api/groups/:id/leave', (req, res) => {
    const groupId = req.params.id;
    const { user } = req.body;

    if (!user) {
        return res.status(400).json({ error: 'User is required' });
    }

    db.get('SELECT members FROM groups WHERE id = ?', [groupId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const members = JSON.parse(row.members);
        const updatedMembers = members.filter(member => member !== user);

        db.run('UPDATE groups SET members = ? WHERE id = ?', [JSON.stringify(updatedMembers), groupId], (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(200).json({ id: groupId, members: updatedMembers });
        });
    });
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
