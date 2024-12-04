const db = require('./server.js'); // server.js now points to groupees.sqlite

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS groupees (
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
        )
    `, (err) => {
        if (err) {
            console.error('Error creating groups table', err);
        } else {
            console.log('Groups table created successfully');
        }
    });
});
db.close();
