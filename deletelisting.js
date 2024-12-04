const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./groupees.sqlite');

/**
 * Deletes a listing if the authenticated user is the creator.
 * @param {number} listingId - The ID of the listing to delete.
 * @param {string} currentUser - The username of the currently authenticated user.
 * @param {function} callback - A callback function to handle the result.
 */
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

module.exports = deleteListing;
