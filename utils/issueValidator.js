function issueValidator(title, description) {
    // REQUIRED VALIDATION
    if (!title || !title.trim()) {
        return {
            value: false,
            message: "Issue title is required"
        }
    };

    if (!description || !description.trim()) {
        return {
            value: false,
            message: "Issue description is required"
        }
    };

    // TITLE LENGTH
    if (title.length < 5) {
        return {
            value: false,
            message: "Issue title must be at least 5 characters"
        }
    };

    if (title.length > 100) {
        return {
            value: false,
            message: "Issue title cannot exceed 100 characters"
        }
    };

    // DESCRIPTION LENGTH
    if (description.length < 10) {
        return {
            value: false,
            message: "Issue description must be at least 10 characters"
        }
    };

    if (description.length > 1000) {
        return {
            value: false,
            message: "Issue description cannot exceed 1000 characters"
        }
    };

    return { valid: true };

    console.log("------- All Done --------")
}

module.exports = { issueValidator };