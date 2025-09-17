/**
 * @summary
 * This feature checks if an email is right email style
 * 
 * @param {string} email - email address
 * 
 * @returns {boolean} email style is right, return true. else return false
 */
export const checkValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}