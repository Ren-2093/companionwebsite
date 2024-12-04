const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true, // Ensures this is a primary key-like field
        autoIncrement: true, // Mimicking AUTOINCREMENT behavior
    },
    name: {
        type: String,
        required: true,
    },
    game: {
        type: String,
        required: true,
    },
    activity: {
        type: String,
        required: true,
    },
    teammatesRequired: {
        type: Number,
        required: true,
        min: 1,
        max: 12, // Ensures the value is between 1 and 12
    },
    difficultyRating: {
        type: Number,
        required: true,
        min: 1,
        max: 10, // Ensures the value is between 1 and 10
    },
    time: {
        type: String,
        required: true, // Storing as a string for now, can be converted to a Date type if needed
    },
    additionalInfo: {
        type: String,
        default: '', // Defaults to an empty string if no additional info is provided
    },
    createdBy: {
        type: String,
        required: true, // Refers to the username or ID of the creator
    },
    members: {
        type: [String], // Array of strings to store members' names or IDs
        default: [], // Defaults to an empty array
    },
});

module.exports = mongoose.model('Group', groupSchema);

