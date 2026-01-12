const userInput = "123";
const query = "SELECT * FROM users WHERE id = '" + userInput + "'"; // SQL Injection
const token = "sk-12345abcde"; // Hardcoded Secret