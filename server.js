const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const deleteListing = require('./deletelisting'); // Correct path to the file
const router = express.Router();

// Initialize the app
const app = express();
const PORT = process.env.PORT || 3000;

// Set 'trust proxy' to 1 if you're behind a reverse proxy (e.g., Nginx, Heroku)
app.set('trust proxy', 1); // Enables secure cookies behind HTTPS proxies

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
    saveUninitialized: false, // Avoid unnecessary session creation
    cookie: {
        secure: true, // Ensures cookies are sent only over HTTPS
        httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
        sameSite: 'strict' // Mitigates CSRF attacks
    }
}));
// Assuming you're using some authentication middleware
app.use((req, res, next) => {
    // Mock authentication middleware to set req.user (replace with actual auth logic)
    req.user = { username: 'user123' }; // Example, replace with actual authenticated user
    next();
});

// Serve the login page (this will be the first page)
app.get('/', (req, res) => {
    if (req.session.user) {
        return res.redirect('/home.html'); // Redirect logged-in users to home
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
        return res.redirect('/index.html'); // Redirect to login if not logged in
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

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Error retrieving user' });
        }
        if (!user) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Error comparing passwords' });
            }
            if (result) {
                req.session.user = { id: user.id, username: user.username }; // Store session
                res.status(200).json({ message: 'Login successful', username: user.username });
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
    res.sendFile(path.join(__dirname, 'lfg-website', 'home.html'));
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

    // Check if a group already exists with the exact same data
    db.get(`
        SELECT * FROM groups 
        WHERE name = ? AND game = ? AND activity = ? 
        AND teammatesRequired = ? AND difficultyRating = ? 
        AND time = ?`,
        [name, game, activity, teammatesRequired, difficultyRating, time], 
        (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Error checking for duplicates: ' + err.message });
            }
            if (row) {
                return res.status(400).json({ error: 'A group with these exact details already exists.' });
            }

            // Validate input
    if (teammatesRequired > 12) {
        return res.status(400).json({ error: 'Teammates required cannot exceed 12.' });
    }
    if (difficultyRating < 1 || difficultyRating > 10) {
        return res.status(400).json({ error: 'Difficulty rating must be between 1 and 10.' });
    }

            // No duplicate found, proceed with creating the new group
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

// Get the logged-in user's profile
app.get('/api/profile', (req, res) => {
    console.log('Session ID:', req.sessionID); // Logs session ID for debugging
    console.log('Session data:', req.session); // Logs session data

    if (!req.session || !req.session.user) {
        console.error('No session or user found');
        return res.status(401).json({ error: 'Unauthorized. Please log in again.' });
    }

    res.status(200).json({ username: req.session.user.username });
});


// The deleteListing function
function deleteListing(listingId, currentUser, callback) {
    // Step 1: Check if the listing exists and verify the creator
    const query = `SELECT createdBy FROM groups WHERE id = ?`;
    db.get(query, [listingId], (err, row) => {
        if (err) {
            callback({ success: false, message: 'Database error', error: err });
            return;
        }

        if (!row) {
            callback({ success: false, message: 'Listing not found' });
            return;
        }

        if (row.createdBy !== currentUser) {
            callback({ success: false, message: 'Unauthorized: You are not the creator of this listing' });
            return;
        }

        // Step 2: Delete the listing if the user is the creator
        const deleteQuery = `DELETE FROM groups WHERE id = ?`;
        db.run(deleteQuery, [listingId], function (deleteErr) {
            if (deleteErr) {
                callback({ success: false, message: 'Error deleting the listing', error: deleteErr });
                return;
            }

            if (this.changes === 0) {
                callback({ success: false, message: 'No listing was deleted' });
            } else {
                callback({ success: true, message: 'Listing deleted successfully' });
            }
        });
    });
}

// API Route to Delete a Group
app.delete('/api/groups/:id', (req, res) => {
    const listingId = parseInt(req.params.id, 10); // The group ID from the URL parameter
    const currentUser = req.user.username; // Assuming `req.user` contains the authenticated user's details

    deleteListing(listingId, currentUser, (result) => {
        if (result.success) {
            res.status(200).json({ message: result.message });
        } else {
            res.status(400).json({ message: result.message, error: result.error });
        }
    });
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
