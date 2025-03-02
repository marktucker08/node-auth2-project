const router = require("express").Router();
const { checkUsernameExists, validateRoleName } = require('./auth-middleware');
const { JWT_SECRET } = require("../secrets"); // use this secret!
const jwt = require('jsonwebtoken');
const Users = require('./../users/users-model')
const bcrypt = require('bcryptjs')

router.post("/register", validateRoleName, (req, res, next) => {
  /**
    [POST] /api/auth/register { "username": "anna", "password": "1234", "role_name": "angel" }

    response:
    status 201
    {
      "user"_id: 3,
      "username": "anna",
      "role_name": "angel"
    }
   */
    const user = {
      username: req.body.username,
      password: req.body.password,
      role_name: req.role_name
    }

    const hash = bcrypt.hashSync(user.password, 10);
  
    user.password = hash

  Users.add(user)
    .then(newUser => {
      res.status(201).json(newUser)
    })
    .catch(next)
});


router.post("/login", checkUsernameExists, (req, res, next) => {
  /**
    [POST] /api/auth/login { "username": "sue", "password": "1234" }

    response:
    status 200
    {
      "message": "sue is back!",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ETC.ETC"
    }

    The token must expire in one day, and must provide the following information
    in its payload:

    {
      "subject"  : 1       // the user_id of the authenticated user
      "username" : "bob"   // the username of the authenticated user
      "role_name": "admin" // the role of the authenticated user
    }
   */
    let { username, password } = req.body;

        if (bcrypt.compareSync(password, req.user.password)) {
          const token = generateToken(req.user); // new line
  
          // the server needs to return the token to the client
          // this doesn't happen automatically like it happens with cookies
          res.status(200).json({
            message: `${req.user.username} is back!`,
            token, // attach the token as part of the response
          });
        } else {
          res.status(401).json({ message: 'Invalid Credentials' });
        }
  
});

function generateToken(user) {
  const payload = {
    subject: user.user_id, // sub in payload is what the token is about
    username: user.username,
    role_name: user.role_name
    // ...otherData
  };

  const options = {
    expiresIn: '1d', // show other available options in the library's documentation
  };

  // extract the secret away so it can be required and used where needed
  return jwt.sign(payload, JWT_SECRET, options); // this method is synchronous
}

module.exports = router;
