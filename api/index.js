const express = require('express')
const jwt = require('jsonwebtoken')

const app = express()

app.use(express.json())
app.use(express.urlencoded())

const users = [
    {
        id: "1",
        name: "Talal",
        password: "johncena00",
        isAdmin: true
    },
    {
        id: "2",
        name: "Huzaifa",
        password: "huzaifacena00",
        isAdmin: false
    },
    {
        id: "3",
        name: "Muizzah",
        password: "muizzahcena00",
        isAdmin: true
    },
    {
        id: "4",
        name: "Ghadda",
        password: "ghaddacena00",
        isAdmin: false
    }
]

let refreshTokens = []

app.post('/api/refresh', (req, res) => {
    //take refresh token from user
    const refreshToken = req.body.token

    //send error if there is no token or invalid token
    if(!refreshToken) return res.status(401).json('You are not authenticated')
    if(!refreshTokens.includes(refreshToken)) return res.status(403).json('Refresh Token is not valid')

    jwt.verify(refreshToken, "myRefreshSecretKey", (err, payload) => {
        if(err) console.log(err)
        refreshTokens = refreshTokens.filter(token => token !== refreshToken)
        
        const newAccessToken = generateToken(payload, "mySecretKey")
        const newRefreshToken = generateToken(payload, "myRefreshSecretKey")

        refreshTokens.push(newRefreshToken)

        res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        })
    }) 
})

const generateToken = (user, key, isAccess) => {
    if(isAccess) return jwt.sign({id:user.id, isAdmin:user.isAdmin}, key, { expiresIn: '10s' })
    else return jwt.sign({id:user.id, isAdmin:user.isAdmin}, key)
}

app.post('/api/login', (req, res) => {
    const { name, password } = req.body
    const user = users.find(u => {
        return u.name === name && u.password === password
    })
    
    if(user) {
        //Generate and access token
        const accessToken = generateToken(user, "mySecretKey", true)
        const refreshToken = generateToken(user, "myRefreshSecretKey", false)

        refreshTokens.push(refreshToken)

        res.json({
            name: user.name,
            isAdmin: user.isAdmin,
            accessToken,
            refreshToken
        })
    }
    else {
        res.status(400).json('Name or password incorrect')
    }
})

const verify = (req, res, next) => {
    const authHeader = req.headers.authorization
    if(authHeader) {
        const token = authHeader.split(' ')[1]
        jwt.verify(token, "mySecretKey", (err, payload) => {
            if(err) return res.status(403).json('Token is not valid')
            req.user = payload
            next()
        })
    }
    else {
        res.status(401).json('You are not authenticated')
    }
}

app.delete('/api/users/:id', verify, (req, res) => {
    if(req.user.id === req.params.id || req.user.isAdmin) {
        res.status(200).json('User has been deleted')
    }
    else {
        res.status(403).json('You are not allowed to delete this user')
    }
})

app.post('/api/logout', verify, (req, res) => {
    const refreshToken = req.body.token
    refreshTokens = refreshTokens.filter(token => token !== refreshToken)
    res.status(200).json('You logged out successfully')
})

app.listen(5000, () => console.log('backend is running'))