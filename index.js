// server.js (Node.js + Express)

const express = require('express');
const axios = require('axios');
const app = express();
require('dotenv').config();

const PORT = 3000;

app.get('/', (req, res) => {
    res.send('Discord OAuth2 Integration');
});

app.get('/callback', async (req, res) => {
    const code = req.query.code;
    
    if (!code) {
        return res.status(400).send('Authorization code missing');
    }

    try {
        // Exchange authorization code for access token
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: process.env.DISCORD_REDIRECT_URI,
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        });

        const { access_token } = tokenResponse.data;

        // Fetch user information
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        const user = userResponse.data;

        // Optionally, add user to your Discord server
        await axios.put(
            `https://discord.com/api/guilds/1263540892338225192/members/${user.id}`,
            { access_token },
            {
                headers: {
                    Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        // Send verification back to client
        res.redirect(`/verification?status=success&user=${user.username}`);
    } catch (error) {
        console.error('Error during Discord OAuth:', error);
        res.redirect(`/verification?status=error`);
    }
});

app.get('/verification', (req, res) => {
    const { status, user } = req.query;

    if (status === 'success') {
        res.send(`<h1>Verification successful! Welcome, ${user}.</h1>`);
    } else {
        res.send(`<h1>Verification failed. Please try again.</h1>`);
    }
});

app.listen(3000, () => {
    console.log(`Server running on port ${3000}`);
});


module.exports = app