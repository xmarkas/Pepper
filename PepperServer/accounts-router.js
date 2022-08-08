const express = require("express");
const router = express.Router();
let { createAccount, validateAccount, getUserInfo, signin } = require('./db');
const { sign } = require("jsonwebtoken");



/**********************************************************************
 * User session and Authenticated user
 **********************************************************************/
router.use((req, res, next) => {
    let sessionId = req.session.id;
    let userHasLogin = req.session.user_is_signed_in;
    console.log("acounts router")
    console.log("id:", sessionId, " User is signed in:", userHasLogin);
    next();
})
  
router.post('/createAccount', (req, res) => {
    createAccount(req, res);
})

router.post('/validateAccount', (req, res) => {
    validateAccount(req, res);
})

router.get('/getUserInfo', (req, res) => {
    getUserInfo(req, res);
})

router.post('/signin', (req, res) => {
    signin(req, res);
})
// Export routes
module.exports = router;