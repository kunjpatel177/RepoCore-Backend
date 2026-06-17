function repoValidator(reponame, description) {

    const reservedNames = ["admin", "api", "root", "system", "backend", "null", "undefined", "repocore", "support", "owner"];
    const repoNameRegex = /^[a-zA-Z0-9-_]+$/;

    if (!reponame) {
        return {
            valid: false,
            message: "Repository name is required",
        }
    }

    // LENGTH VALIDATION
    if (reponame.length < 3) {
        return {
            valid: false,
            message: "Repository name must be at least 3 characters",
        }
    }

    if (reponame.length > 30) {
        return {
            valid: false,
            message: "Repository name cannot exceed 30 characters",
        }
    }

    if (!repoNameRegex.test(reponame)) {
        return {
            valid: false,
            message: "Repository name can only contain letters, numbers, hyphens and underscores",
        }
    }

    if (reservedNames.includes(reponame)) {
        return {
            valid: false,
            message: "This repository name is reserved",
        }
    }

    if (description && description.length > 300) {
        return {
            valid: false,
            message: "Description cannot exceed 300 characters",
        }
    }

    return {valid : true}

}

module.exports = { repoValidator };