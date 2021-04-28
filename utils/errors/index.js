module.exports = class ErrorHandling {
    static handleErrors = (err) => {

        // Define error list
        let errors;
        // invalid email
        if (err.message === "invalid emailaddress") {
            errors = { message: 'This email is invalid.' }
        }

        // Unregistered email
        if (err.message === "incorrect username") {
            errors = { message: "This username is not registered." };
        };

        // Duplicate email error
        if (err.code === 11000) {
            errors = { message: "This email is already in use." };
            return errors;
        };

        // incorrect password
        if (err.message === "incorrect password") {
            errors = { message: "Your password is incorrect. Try again." };
        };

        // duplicate email	
        if (err.message === "email already exists") {
            errors = { message: "This account is already in use." };
        };


        //Validation errors
        if (err.message.includes("user validation failed")) {
            Object.values(err.errors).forEach((value, _, __) => {
                errors = { message: value.message };
            });
        };

        return errors;
    };
}