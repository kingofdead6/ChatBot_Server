import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Log all incoming requests for debugging (without the body)
app.use((req, res, next) => {
    console.log(`Received ${req.method} request to ${req.url}`);
    next();
});

app.get('/', (req, res) => {
    res.status(200).send({
        message: 'Hello from CodeX!'
    });
});

app.post('/', async (req, res) => {
    try {
        const prompt = req.body.prompt;
        const instruction = 'Answer the following question or respond to the statement: '; // Define instruction separately
        const fullInput = `${instruction}${prompt}`; // Construct the full input sent to the API

        const response = await axios.post(
            'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
            {
                inputs: fullInput, // Send the full input to the API
                parameters: {
                    max_length: 30,
                    temperature: 1,
                    top_p: 0.5,
                    num_return_sequences: 1
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Post-process the response to remove the full input if it appears at the start
        let botResponse = response.data[0].generated_text.trim();
        if (botResponse.startsWith(fullInput)) {
            botResponse = botResponse.substring(fullInput.length).trim();
        }

        res.status(200).send({
            bot: botResponse // Send only the actual response, not the instruction or prompt
        });
    } catch (error) {
        console.error('Hugging Face Error:', error.response?.data || error.message);
        const status = error.response?.status || 500;
        const errorMessage = error.response?.data?.error || error.message || 'Something went wrong';
        res.status(status).send({ error: errorMessage });
    }
});

app.listen(5000, () => console.log('AI server started on http://localhost:5000 - Unique Debug ID: 12345'));